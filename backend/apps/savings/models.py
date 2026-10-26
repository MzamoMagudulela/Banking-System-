import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _
from apps.banking.models import BankAccount, Transaction

class GoalCategory(models.TextChoices):
    EMERGENCY = 'EMERGENCY', _('Emergency Fund')
    EDUCATION = 'EDUCATION', _('Education / School Fees')
    HOUSING = 'HOUSING', _('Home Improvement / Rent')
    BUSINESS = 'BUSINESS', _('Small Business / Equipment')
    VEHICLE = 'VEHICLE', _('Vehicle / Transport')
    HOLIDAY = 'HOLIDAY', _('Holiday / Festive')
    OTHER = 'OTHER', _('Other Personal Goal')

class GoalStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')

class SavingsGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='savings_goals')
    account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name='associated_goals', null=True, blank=True)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=30, choices=GoalCategory.choices, default=GoalCategory.OTHER)
    target_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('10.00'))]
    )
    current_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    target_date = models.DateField()
    status = models.CharField(max_length=20, choices=GoalStatus.choices, default=GoalStatus.IN_PROGRESS)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['target_date']

    @property
    def progress_percentage(self):
        if self.target_amount <= Decimal('0.00'):
            return 100.0
        pct = float(self.current_amount / self.target_amount * 100)
        return min(round(pct, 1), 100.0)

    @property
    def remaining_amount(self):
        diff = self.target_amount - self.current_amount
        return max(Decimal('0.00'), diff)

    def __str__(self):
        return f"{self.name} - R{self.current_amount} / R{self.target_amount} ({self.progress_percentage}%)"


class SavingsContribution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(SavingsGoal, on_delete=models.CASCADE, related_name='contributions')
    account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name='goal_contributions')
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('1.00'))])
    notes = models.CharField(max_length=255, blank=True, default='')
    transaction = models.ForeignKey(Transaction, null=True, blank=True, on_delete=models.SET_NULL)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"R{self.amount} to {self.goal.name} at {self.timestamp:%Y-%m-%d}"


class CircleFrequency(models.TextChoices):
    WEEKLY = 'WEEKLY', _('Weekly')
    FORTNIGHTLY = 'FORTNIGHTLY', _('Fortnightly')
    MONTHLY = 'MONTHLY', _('Monthly')

class CircleStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    COMPLETED = 'COMPLETED', _('Completed')
    DORMANT = 'DORMANT', _('Dormant')

class SavingsCircle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_circles')
    target_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    contribution_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('10.00'))]
    )
    frequency = models.CharField(max_length=20, choices=CircleFrequency.choices, default=CircleFrequency.MONTHLY)
    current_round = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=CircleStatus.choices, default=CircleStatus.ACTIVE)
    meeting_day = models.CharField(max_length=50, blank=True, default='Last Saturday of the Month')
    payout_rule_description = models.TextField(
        default='Rotating monthly payout decided by leader consensus or group agreement'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def total_collected(self):
        return self.contributions.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

    def __str__(self):
        return f"Circle: {self.name} (R{self.contribution_amount} {self.frequency})"


class MemberRole(models.TextChoices):
    LEADER = 'LEADER', _('Circle Chairperson / Leader')
    TREASURER = 'TREASURER', _('Treasurer')
    MEMBER = 'MEMBER', _('Contributing Member')

class SavingsCircleMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    circle = models.ForeignKey(SavingsCircle, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='circle_memberships')
    role = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('circle', 'user')

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} in {self.circle.name} ({self.role})"


class CircleContribution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    circle = models.ForeignKey(SavingsCircle, on_delete=models.CASCADE, related_name='contributions')
    member = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='circle_contributions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    round_number = models.PositiveIntegerField(default=1)
    transaction = models.ForeignKey(Transaction, null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.CharField(max_length=255, blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"R{self.amount} from {self.member.email} to {self.circle.name} (Round {self.round_number})"


class PayoutStatus(models.TextChoices):
    PROPOSED = 'PROPOSED', _('Proposed')
    APPROVED = 'APPROVED', _('Approved')
    DISBURSED = 'DISBURSED', _('Disbursed')
    REJECTED = 'REJECTED', _('Rejected')

class CirclePayout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    circle = models.ForeignKey(SavingsCircle, on_delete=models.CASCADE, related_name='payouts')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='received_circle_payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    round_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.PROPOSED)
    notes = models.TextField(blank=True, default='')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='approved_payouts'
    )
    transaction = models.ForeignKey(Transaction, null=True, blank=True, on_delete=models.SET_NULL)
    proposed_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-proposed_at']

    def __str__(self):
        return f"Payout R{self.amount} to {self.recipient.email} - {self.status}"
