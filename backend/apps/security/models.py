import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.banking.models import BankAccount, Transaction

class AlertSeverity(models.TextChoices):
    LOW = 'LOW', _('Low')
    MEDIUM = 'MEDIUM', _('Medium')
    HIGH = 'HIGH', _('High')
    CRITICAL = 'CRITICAL', _('Critical')

class AlertStatus(models.TextChoices):
    TRIGGERED = 'TRIGGERED', _('Triggered / New')
    INVESTIGATING = 'INVESTIGATING', _('Under Review')
    RESOLVED = 'RESOLVED', _('Resolved / Legitimate')
    DISMISSED = 'DISMISSED', _('Dismissed / False Positive')

class SecurityAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='security_alerts'
    )
    account = models.ForeignKey(
        BankAccount, null=True, blank=True, on_delete=models.SET_NULL, related_name='security_alerts'
    )
    transaction = models.ForeignKey(
        Transaction, null=True, blank=True, on_delete=models.SET_NULL, related_name='security_alerts'
    )
    rule_name = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=20, choices=AlertSeverity.choices, default=AlertSeverity.MEDIUM)
    status = models.CharField(max_length=20, choices=AlertStatus.choices, default=AlertStatus.TRIGGERED)
    description = models.TextField()
    evidence_details = models.JSONField(default=dict, blank=True)
    staff_resolution_notes = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='resolved_alerts'
    )
    is_customer_reported = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.rule_name} for {self.user.email} ({self.status})"


class SecurityRuleConfig(models.Model):
    """Admin-configurable rule thresholds for fraud watch."""
    rule_key = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    threshold_value = models.DecimalField(max_digits=12, decimal_places=2)
    is_enabled = models.BooleanField(default=True)
    severity = models.CharField(max_length=20, choices=AlertSeverity.choices, default=AlertSeverity.HIGH)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Threshold: {self.threshold_value}) [Enabled: {self.is_enabled}]"
