import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

class AccountType(models.TextChoices):
    SAVINGS = 'SAVINGS', _('Savings Account')
    CURRENT = 'CURRENT', _('Current / Cheque Account')
    GOAL_SAVINGS = 'GOAL_SAVINGS', _('Target Goal Account')

class AccountStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    SUSPENDED = 'SUSPENDED', _('Suspended')
    CLOSED = 'CLOSED', _('Closed')

class BankAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account_number = models.CharField(max_length=20, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='bank_accounts')
    account_type = models.CharField(max_length=20, choices=AccountType.choices, default=AccountType.SAVINGS)
    status = models.CharField(max_length=20, choices=AccountStatus.choices, default=AccountStatus.ACTIVE)
    currency = models.CharField(max_length=5, default='ZAR')
    available_balance = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    ledger_balance = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    daily_transfer_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('50000.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def is_operational(self):
        return self.status == AccountStatus.ACTIVE

    def __str__(self):
        return f"{self.account_number} ({self.get_account_type_display()}) - R{self.available_balance}"


class TransactionType(models.TextChoices):
    DEPOSIT = 'DEPOSIT', _('Simulated Deposit')
    WITHDRAWAL = 'WITHDRAWAL', _('Simulated Withdrawal')
    TRANSFER = 'TRANSFER', _('Internal Transfer')
    LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT', _('Loan Disbursement')
    LOAN_REPAYMENT = 'LOAN_REPAYMENT', _('Loan Repayment')
    CIRCLE_CONTRIBUTION = 'CIRCLE_CONTRIBUTION', _('Savings Circle Contribution')
    CIRCLE_PAYOUT = 'CIRCLE_PAYOUT', _('Savings Circle Payout')
    REVERSAL = 'REVERSAL', _('Transaction Reversal')

class TransactionStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    COMPLETED = 'COMPLETED', _('Completed')
    FAILED = 'FAILED', _('Failed')
    REVERSED = 'REVERSED', _('Reversed')

class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=40, unique=True, db_index=True)
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    source_account = models.ForeignKey(
        BankAccount, null=True, blank=True, on_delete=models.PROTECT, related_name='outgoing_transactions'
    )
    destination_account = models.ForeignKey(
        BankAccount, null=True, blank=True, on_delete=models.PROTECT, related_name='incoming_transactions'
    )
    amount = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=5, default='ZAR')
    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)
    description = models.CharField(max_length=255)
    initiating_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='initiated_transactions'
    )
    idempotency_key = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    reversal_of = models.OneToOneField(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='reversal_transaction'
    )
    failure_reason = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} [{self.transaction_type}] R{self.amount} ({self.status})"


class EntryType(models.TextChoices):
    DEBIT = 'DEBIT', _('Debit')
    CREDIT = 'CREDIT', _('Credit')

class TransactionEntry(models.Model):
    """
    Auditable double-entry ledger entry.
    Every posted transaction creates balanced debit and credit entries.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(Transaction, on_delete=models.PROTECT, related_name='ledger_entries')
    account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name='ledger_entries')
    entry_type = models.CharField(max_length=10, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.entry_type} R{self.amount} on {self.account.account_number} -> Balance: R{self.balance_after}"


class IdempotencyRecord(models.Model):
    key = models.CharField(max_length=128, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    request_hash = models.CharField(max_length=64)
    response_status = models.IntegerField()
    response_body = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Idempotency: {self.key} by {self.user.email}"
