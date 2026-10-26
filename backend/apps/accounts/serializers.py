from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import User, UserRole, CustomerProfile, AuditEvent

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'date_of_birth', 'residential_address', 'city', 'province',
            'postal_code', 'employment_status', 'monthly_income', 'kyc_status',
            'verification_notes', 'verified_at'
        ]
        read_only_fields = ['id', 'kyc_status', 'verification_notes', 'verified_at']

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'role',
            'phone_number', 'national_id', 'preferred_language', 'is_verified',
            'created_at', 'customer_profile'
        ]
        read_only_fields = ['id', 'role', 'is_verified', 'created_at']

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    preferred_language = serializers.ChoiceField(choices=[('en', 'English'), ('zu', 'isiZulu')], default='en')
    initial_deposit = serializers.DecimalField(max_digits=10, decimal_places=2, default=1000.00, required=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            # Check if user exists to record failed attempt
            u = User.objects.filter(email=email).first()
            if u:
                u.failed_login_attempts += 1
                u.save(update_fields=['failed_login_attempts'])
                if u.failed_login_attempts >= 5:
                    from apps.security.models import SecurityAlert, AlertSeverity, AlertStatus
                    SecurityAlert.objects.get_or_create(
                        user=u,
                        rule_name='Multiple Failed Login Attempts',
                        status=AlertStatus.TRIGGERED,
                        defaults={
                            'severity': AlertSeverity.MEDIUM,
                            'description': f"User {u.email} experienced {u.failed_login_attempts} consecutive failed login attempts."
                        }
                    )
            raise serializers.ValidationError("Invalid email address or password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        # Reset failed attempts
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.save(update_fields=['failed_login_attempts'])

        data['user'] = user
        return data

class AuditEventSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = AuditEvent
        fields = ['id', 'user_email', 'action', 'resource_type', 'resource_id', 'ip_address', 'details', 'timestamp']
