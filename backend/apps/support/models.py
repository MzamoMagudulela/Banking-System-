import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class TicketCategory(models.TextChoices):
    GENERAL = 'GENERAL', _('General Inquiry')
    ACCOUNT = 'ACCOUNT', _('Account & Profile')
    TRANSACTION = 'TRANSACTION', _('Transaction Discrepancy')
    SAVINGS = 'SAVINGS', _('Savings Goal & Circles')
    LOANS = 'LOANS', _('Microloan Application')
    SECURITY = 'SECURITY', _('Security & Fraud Concern')

class TicketPriority(models.TextChoices):
    LOW = 'LOW', _('Low')
    MEDIUM = 'MEDIUM', _('Medium')
    HIGH = 'HIGH', _('High')
    URGENT = 'URGENT', _('Urgent')

class TicketStatus(models.TextChoices):
    OPEN = 'OPEN', _('Open')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    WAITING_CUSTOMER = 'WAITING_CUSTOMER', _('Waiting on Customer')
    RESOLVED = 'RESOLVED', _('Resolved')
    CLOSED = 'CLOSED', _('Closed')

class SupportTicket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=TicketCategory.choices, default=TicketCategory.GENERAL)
    priority = models.CharField(max_length=20, choices=TicketPriority.choices, default=TicketPriority.MEDIUM)
    status = models.CharField(max_length=20, choices=TicketStatus.choices, default=TicketStatus.OPEN)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_tickets'
    )
    resolution_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"[{self.ticket_number}] {self.subject} ({self.status})"


class SupportMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_messages')
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message by {self.sender.email} on Ticket {self.ticket.ticket_number}"
