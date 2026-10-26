import secrets
from decimal import Decimal
from django.db.models import Q
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.banking.models import BankAccount, Transaction, AccountStatus, AccountType
from apps.banking.serializers import (
    BankAccountSerializer, TransactionSerializer, TransferRequestSerializer,
    DepositWithdrawRequestSerializer, OpenAccountSerializer
)
from apps.banking.services import TransactionService
from apps.banking.exceptions import BankingException
from apps.accounts.permissions import IsStaffUser
from apps.accounts.views import record_audit
from apps.security.models import SecurityAlert, AlertSeverity, AlertStatus

class BankAccountViewSet(viewsets.ModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_bank_staff():
            qs = BankAccount.objects.select_related('user').all()
            search = self.request.query_params.get('search')
            acc_type = self.request.query_params.get('account_type')
            acc_status = self.request.query_params.get('status')
            if search:
                qs = qs.filter(
                    Q(account_number__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(user__first_name__icontains=search) |
                    Q(user__last_name__icontains=search)
                )
            if acc_type:
                qs = qs.filter(account_type=acc_type)
            if acc_status:
                qs = qs.filter(status=acc_status)
            return qs
        return BankAccount.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        serializer = OpenAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        acc_type = serializer.validated_data['account_type']
        initial_deposit = serializer.validated_data.get('initial_deposit', Decimal('0.00'))

        acc_num = f"SB-{secrets.randbelow(90000000) + 10000000}"
        account = BankAccount.objects.create(
            account_number=acc_num,
            user=request.user,
            account_type=acc_type,
            status=AccountStatus.ACTIVE,
            currency='ZAR',
            available_balance=Decimal('0.00'),
            ledger_balance=Decimal('0.00')
        )

        if initial_deposit > Decimal('0.00'):
            TransactionService.execute_deposit(
                account=account,
                amount=initial_deposit,
                description='Opening Initial Deposit',
                initiating_user=request.user
            )
            account.refresh_from_db()

        record_audit(request, 'OPEN_ACCOUNT', 'BankAccount', account.id, {'account_number': account.account_number})
        return Response(BankAccountSerializer(account).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsStaffUser])
    def set_status(self, request, pk=None):
        account = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.CLOSED]:
            return Response({'error': 'Invalid status provided.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '')
        old_status = account.status
        account.status = new_status
        account.save(update_fields=['status', 'updated_at'])

        record_audit(
            request, f'ACCOUNT_STATUS_{new_status}', 'BankAccount', account.id,
            {'previous_status': old_status, 'reason': reason}
        )
        return Response({'message': f'Account status updated to {new_status}.', 'account': BankAccountSerializer(account).data})


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.select_related(
            'source_account', 'destination_account', 'initiating_user'
        ).prefetch_related('ledger_entries')

        if not user.is_bank_staff():
            user_account_ids = BankAccount.objects.filter(user=user).values_list('id', flat=True)
            qs = qs.filter(
                Q(source_account__in=user_account_ids) | Q(destination_account__in=user_account_ids)
            )

        # Filters
        tx_type = self.request.query_params.get('transaction_type')
        tx_status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        account_id = self.request.query_params.get('account_id')

        if tx_type:
            qs = qs.filter(transaction_type=tx_type)
        if tx_status:
            qs = qs.filter(status=tx_status)
        if account_id:
            qs = qs.filter(Q(source_account_id=account_id) | Q(destination_account_id=account_id))
        if search:
            qs = qs.filter(Q(reference__icontains=search) | Q(description__icontains=search))

        return qs.order_by('-created_at')


class TransferView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TransferRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        source_account = BankAccount.objects.filter(id=data['source_account_id']).first()
        if not source_account:
            return Response({'error': 'Source account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_bank_staff() and source_account.user != request.user:
            return Response({'error': 'You are not authorized to transfer from this account.'}, status=status.HTTP_403_FORBIDDEN)

        destination_account = BankAccount.objects.filter(
            account_number=data['destination_account_number'].strip().upper()
        ).first()
        if not destination_account:
            return Response({'error': f"Destination account '{data['destination_account_number']}' not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            txn = TransactionService.execute_transfer(
                source_account=source_account,
                destination_account=destination_account,
                amount=data['amount'],
                description=data.get('description', ''),
                initiating_user=request.user,
                idempotency_key=data.get('idempotency_key')
            )
            record_audit(request, 'EXECUTE_TRANSFER', 'Transaction', txn.id, {'reference': txn.reference, 'amount': str(txn.amount)})
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except BankingException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DepositView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DepositWithdrawRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        account = BankAccount.objects.filter(id=data['account_id']).first()
        if not account:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_bank_staff() and account.user != request.user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            txn = TransactionService.execute_deposit(
                account=account,
                amount=data['amount'],
                description=data.get('description', 'Simulated Card/EFT Deposit'),
                initiating_user=request.user,
                idempotency_key=data.get('idempotency_key')
            )
            record_audit(request, 'EXECUTE_DEPOSIT', 'Transaction', txn.id, {'amount': str(txn.amount)})
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except BankingException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WithdrawView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DepositWithdrawRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        account = BankAccount.objects.filter(id=data['account_id']).first()
        if not account:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_bank_staff() and account.user != request.user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            txn = TransactionService.execute_withdrawal(
                account=account,
                amount=data['amount'],
                description=data.get('description', 'Simulated ATM Withdrawal'),
                initiating_user=request.user,
                idempotency_key=data.get('idempotency_key')
            )
            record_audit(request, 'EXECUTE_WITHDRAWAL', 'Transaction', txn.id, {'amount': str(txn.amount)})
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        except BankingException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReverseTransactionView(views.APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, pk):
        txn = Transaction.objects.filter(id=pk).first()
        if not txn:
            return Response({'error': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Administrative reversal')
        try:
            rev_txn = TransactionService.execute_reversal(
                original_txn=txn,
                reason=reason,
                initiating_user=request.user
            )
            record_audit(request, 'REVERSE_TRANSACTION', 'Transaction', txn.id, {'reason': reason})
            return Response(TransactionSerializer(rev_txn).data, status=status.HTTP_200_OK)
        except BankingException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReportTransactionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        txn = Transaction.objects.filter(id=pk).first()
        if not txn:
            return Response({'error': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Customer reported unrecognized transaction')
        alert = SecurityAlert.objects.create(
            user=request.user,
            account=txn.source_account or txn.destination_account,
            transaction=txn,
            rule_name='Customer Reported Transaction',
            severity=AlertSeverity.HIGH,
            status=AlertStatus.TRIGGERED,
            is_customer_reported=True,
            description=f"Customer {request.user.email} reported transaction {txn.reference}: {reason}",
            evidence_details={'reported_reason': reason, 'transaction_amount': str(txn.amount)}
        )
        record_audit(request, 'REPORT_TRANSACTION', 'Transaction', txn.id, {'alert_id': str(alert.id)})
        return Response({
            'message': 'Transaction reported. Bank security team has been notified.',
            'alert_id': alert.id
        })
