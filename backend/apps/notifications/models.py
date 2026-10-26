import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class NotificationType(models.TextChoices):
    TRANSACTION = 'TRANSACTION', _('Transaction Notice')
    GOAL = 'GOAL', _('Savings Goal Milestone')
    LOAN = 'LOAN', _('Loan Status Update')
    CIRCLE = 'CIRCLE', _('Community Circle Event')
    SECURITY = 'SECURITY', _('Security Alert')
    SUPPORT = 'SUPPORT', _('Support Ticket Update')
    SYSTEM = 'SYSTEM', _('System Announcement')

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        status = "Read" if self.is_read else "Unread"
        return f"[{self.notification_type}] {self.title} to {self.user.email} ({status})"
