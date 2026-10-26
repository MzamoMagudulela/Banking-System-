import secrets
from decimal import Decimal
from django.utils import timezone
from rest_framework import status, views, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema

from apps.accounts.models import User, UserRole, CustomerProfile, KycStatus, AuditEvent
from apps.accounts.serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    CustomerProfileSerializer, AuditEventSerializer
)
from apps.accounts.permissions import IsStaffUser, IsAdminUser
from apps.banking.models import BankAccount, AccountType, AccountStatus
from apps.banking.services import TransactionService

def record_audit(request, action, resource_type, resource_id="", details=None):
    user = request.user if request and request.user.is_authenticated else None
    ip = request.META.get('REMOTE_ADDR') if request else None
    agent = request.META.get('HTTP_USER_AGENT', '')[:255] if request else ''
    AuditEvent.objects.create(
        user=user,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        ip_address=ip,
        user_agent=agent,
        details=details or {}
    )

class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone_number=data.get('phone_number', ''),
            preferred_language=data.get('preferred_language', 'en'),
            role=UserRole.CUSTOMER,
            is_verified=False
        )

        CustomerProfile.objects.create(
            user=user,
            kyc_status=KycStatus.PENDING
        )

        # Generate unique fictional account number: SB- followed by 8 random digits
        acc_num = f"SB-{secrets.randbelow(90000000) + 10000000}"
        account = BankAccount.objects.create(
            account_number=acc_num,
            user=user,
            account_type=AccountType.SAVINGS,
            status=AccountStatus.ACTIVE,
            currency='ZAR',
            available_balance=Decimal('0.00'),
            ledger_balance=Decimal('0.00')
        )

        # Initial simulated welcome deposit if requested
        initial_deposit = data.get('initial_deposit', Decimal('1000.00'))
        if initial_deposit > Decimal('0.00'):
            TransactionService.execute_deposit(
                account=account,
                amount=initial_deposit,
                description='SmartBank Welcome Grant (Simulated)',
                initiating_user=user
            )

        token, _ = Token.objects.get_or_create(user=user)
        record_audit(request, 'REGISTER_CUSTOMER', 'User', user.id, {'email': user.email})

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'primary_account': {
                'id': account.id,
                'account_number': account.account_number,
                'balance': str(account.available_balance)
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(views.APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        token, _ = Token.objects.get_or_create(user=user)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        record_audit(request, 'USER_LOGIN', 'User', user.id, {'role': user.role})

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        record_audit(request, 'USER_LOGOUT', 'User', request.user.id)
        return Response({'message': 'Logged out successfully.'})


class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data

        # Update basic user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'preferred_language' in data:
            user.preferred_language = data['preferred_language']
        user.save()

        # Update customer profile if exists
        if hasattr(user, 'customer_profile'):
            profile = user.customer_profile
            for field in ['date_of_birth', 'residential_address', 'city', 'province', 'postal_code', 'employment_status', 'monthly_income']:
                if field in data:
                    setattr(profile, field, data[field])
            profile.save()

        record_audit(request, 'UPDATE_PROFILE', 'User', user.id)
        return Response(UserSerializer(user).data)


class PasswordResetSimulatedView(views.APIView):
    """Simulated local development password reset endpoint."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        new_password = request.data.get('new_password')
        if not email or not new_password:
            return Response({'error': 'Email and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            user.set_password(new_password)
            user.failed_login_attempts = 0
            user.save()
            record_audit(request, 'PASSWORD_RESET', 'User', user.id)

        return Response({
            'message': 'If the account exists, the password has been updated for this simulated environment.'
        })


class CustomerManagementViewSet(viewsets.ModelViewSet):
    """Staff only: list and manage customer profiles."""
    permission_classes = [IsStaffUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.filter(role=UserRole.CUSTOMER).select_related('customer_profile').order_by('-created_at')
        search = self.request.query_params.get('search')
        kyc = self.request.query_params.get('kyc_status')
        if search:
            qs = qs.filter(email__icontains=search) | qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search)
        if kyc:
            qs = qs.filter(customer_profile__kyc_status=kyc)
        return qs


class VerifyCustomerView(views.APIView):
    """Staff only: verify or reject customer KYC."""
    permission_classes = [IsStaffUser]

    def post(self, request, pk):
        user = User.objects.filter(id=pk, role=UserRole.CUSTOMER).first()
        if not user:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

        kyc_status = request.data.get('status')
        if kyc_status not in [KycStatus.VERIFIED, KycStatus.REJECTED]:
            return Response({'error': 'Invalid status. Must be VERIFIED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        notes = request.data.get('notes', '')
        profile = user.customer_profile
        profile.kyc_status = kyc_status
        profile.verification_notes = notes
        profile.verified_by = request.user
        profile.verified_at = timezone.now()
        profile.save()

        user.is_verified = (kyc_status == KycStatus.VERIFIED)
        user.save(update_fields=['is_verified'])

        record_audit(request, f'KYC_{kyc_status}', 'CustomerProfile', profile.id, {'customer_email': user.email})
        return Response({'message': f'Customer KYC updated to {kyc_status}.', 'user': UserSerializer(user).data})


class StaffManagementView(views.APIView):
    """Admin only: list and create bank staff users."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        staff = User.objects.filter(role__in=[UserRole.STAFF, UserRole.ADMIN]).order_by('-created_at')
        return Response(UserSerializer(staff, many=True).data)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        role = request.data.get('role', UserRole.STAFF)
        if role not in [UserRole.STAFF, UserRole.ADMIN]:
            return Response({'error': 'Role must be STAFF or ADMIN.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'User already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=request.data.get('password', 'StaffSecure123!'),
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
            role=role,
            is_verified=True
        )
        record_audit(request, 'CREATE_STAFF_MEMBER', 'User', user.id, {'role': role, 'email': email})
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class AuditLogListView(views.APIView):
    """Staff & Admin: view chronological audit log."""
    permission_classes = [IsStaffUser]

    def get(self, request):
        logs = AuditEvent.objects.select_related('user').all()[:100]
        return Response(AuditEventSerializer(logs, many=True).data)
