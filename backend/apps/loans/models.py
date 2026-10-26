import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from apps.banking.models import BankAccount, Transaction

class LoanStatus(models.TextChoices):
    SUBMITTED = 'SUBMITTED', _('Submitted')
    INFO_REQUESTED = 'INFO_REQUESTED', _('Additional Information Requested')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')
    DISBURSED = 'DISBURSED', _('Disbursed & Active')
    CLOSED = 'CLOSED', _('Fully Repaid / Closed')

class LoanPurpose(models.TextChoices):
    BUSINESS_STOCK = 'BUSINESS_STOCK', _('Small Business Inventory / Stock')
    EQUIPMENT = 'EQUIPMENT', _('Tools / Machinery / Equipment')
    EMERGENCY = 'EMERGENCY', _('Family Emergency / Medical')
    EDUCATION = 'EDUCATION', _('Tuition / School Uniforms & Books')
    AGRICULTURE = 'AGRICULTURE', _('Farming / Agricultural Inputs')
    OTHER = 'OTHER', _('Other Community Need')

class LoanApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loan_applications')
    disbursement_account = models.ForeignKey(
        BankAccount, on_delete=models.PROTECT, related_name='disbursed_loans'
    )
    purpose = models.CharField(max_length=40, choices=LoanPurpose.choices, default=LoanPurpose.BUSINESS_STOCK)
    amount_requested = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('500.00')), MaxValueValidator(Decimal('100000.00'))]
    )
    term_months = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(36)],
        default=6
    )
    monthly_interest_rate = models.DecimalField(
        max_digits=5, decimal_places=4, default=Decimal('0.0250'), # 2.5% monthly illustrative rate
        help_text='Illustrative monthly interest rate (e.g. 0.025 for 2.5%)'
    )
    origination_fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('50.00'),
        help_text='Transparent fixed administrative fee'
    )
    calculated_monthly_payment = models.DecimalField(max_digits=12, decimal_places=2)
    total_repayment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=25, choices=LoanStatus.choices, default=LoanStatus.SUBMITTED)
    applicant_notes = models.TextField(blank=True, default='')
    staff_notes = models.TextField(blank=True, default='')
    decision_reason = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_loans'
    )
    disbursement_transaction = models.ForeignKey(
        Transaction, null=True, blank=True, on_delete=models.SET_NULL, related_name='loan_disbursements'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @staticmethod
    def calculate_payment(principal: Decimal, monthly_rate: Decimal, months: int, fee: Decimal = Decimal('0.00')) -> tuple[Decimal, Decimal]:
        """
        Calculates monthly payment and total repayment.
        Formula: Payment = P * r * (1 + r)^n / ((1 + r)^n - 1)
        If r == 0: Payment = P / n
        """
        P = float(principal)
        r = float(monthly_rate)
        n = int(months)
        f = float(fee)

        if n <= 0:
            raise ValueError("Loan term must be at least 1 month")

        if r == 0:
            monthly_pmt = P / n
        else:
            factor = (1.0 + r) ** n
            monthly_pmt = P * (r * factor) / (factor - 1.0)

        total_repaid = (monthly_pmt * n) + f
        return Decimal(f"{monthly_pmt:.2f}"), Decimal(f"{total_repaid:.2f}")

    def __str__(self):
        return f"Loan {self.id.hex[:8]} - R{self.amount_requested} for {self.user.email} [{self.status}]"


class RepaymentStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', _('Scheduled')
    PAID = 'PAID', _('Paid')
    OVERDUE = 'OVERDUE', _('Overdue')

class LoanRepayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='repayments')
    installment_number = models.PositiveIntegerField()
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=RepaymentStatus.choices, default=RepaymentStatus.SCHEDULED)
    transaction = models.ForeignKey(Transaction, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ['due_date']

    def __str__(self):
        return f"Installment #{self.installment_number} for Loan {self.loan.id.hex[:8]} - R{self.amount_due} [{self.status}]"
