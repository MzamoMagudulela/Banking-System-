import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class UserRole(models.TextChoices):
    CUSTOMER = 'CUSTOMER', _('Customer')
    STAFF = 'STAFF', _('Bank Staff')
    ADMIN = 'ADMIN', _('Administrator')

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=20, blank=True, default='')
    national_id = models.CharField(max_length=30, blank=True, default='', help_text='Simulated ID number')
    preferred_language = models.CharField(max_length=10, default='en', choices=[('en', 'English'), ('zu', 'isiZulu')])
    is_verified = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def is_customer(self):
        return self.role == UserRole.CUSTOMER

    def is_bank_staff(self):
        return self.role in [UserRole.STAFF, UserRole.ADMIN]

    def is_administrator(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class KycStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending Verification')
    VERIFIED = 'VERIFIED', _('Verified')
    REJECTED = 'REJECTED', _('Rejected')

class CustomerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    residential_address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='Johannesburg')
    province = models.CharField(max_length=100, blank=True, default='Gauteng')
    postal_code = models.CharField(max_length=20, blank=True, default='')
    employment_status = models.CharField(
        max_length=50,
        choices=[
            ('EMPLOYED', 'Employed'),
            ('SELF_EMPLOYED', 'Self-Employed / Entrepreneur'),
            ('INFORMAL', 'Informal Economy / Trader'),
            ('UNEMPLOYED', 'Unemployed'),
            ('STUDENT', 'Student'),
            ('RETIRED', 'Retired'),
        ],
        default='EMPLOYED'
    )
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    kyc_status = models.CharField(max_length=20, choices=KycStatus.choices, default=KycStatus.PENDING)
    verification_notes = models.TextField(blank=True, default='')
    verified_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='verified_customers')
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile of {self.user.get_full_name() or self.user.email} - {self.kyc_status}"


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_events')
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    resource_id = models.CharField(max_length=100, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.user.email if self.user else 'Anonymous'
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S}] {actor}: {self.action} on {self.resource_type} ({self.resource_id})"
