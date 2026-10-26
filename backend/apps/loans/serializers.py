from decimal import Decimal
from rest_framework import serializers
from apps.loans.models import LoanApplication, LoanRepayment, LoanStatus, LoanPurpose

class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRepayment
        fields = [
            'id', 'installment_number', 'amount_due', 'amount_paid',
            'due_date', 'paid_date', 'status'
        ]

class LoanApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.ReadOnlyField(source='user.email')
    account_number = serializers.ReadOnlyField(source='disbursement_account.account_number')
    repayments = LoanRepaymentSerializer(many=True, read_only=True)
    reviewed_by_email = serializers.ReadOnlyField(source='reviewed_by.email')

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'user', 'applicant_name', 'applicant_email', 'disbursement_account',
            'account_number', 'purpose', 'amount_requested', 'term_months',
            'monthly_interest_rate', 'origination_fee', 'calculated_monthly_payment',
            'total_repayment_amount', 'status', 'applicant_notes', 'staff_notes',
            'decision_reason', 'reviewed_by_email', 'reviewed_at', 'disbursed_at',
            'created_at', 'repayments'
        ]
        read_only_fields = [
            'id', 'user', 'calculated_monthly_payment', 'total_repayment_amount',
            'status', 'staff_notes', 'decision_reason', 'reviewed_by_email',
            'reviewed_at', 'disbursed_at', 'created_at'
        ]

    def get_applicant_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class LoanCalculateRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('500.00'), max_value=Decimal('100000.00'))
    term_months = serializers.IntegerField(min_value=1, max_value=36)
    monthly_interest_rate = serializers.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.025'), required=False)
    origination_fee = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal('50.00'), required=False)

class LoanApplyRequestSerializer(serializers.Serializer):
    disbursement_account_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('500.00'), max_value=Decimal('100000.00'))
    term_months = serializers.IntegerField(min_value=1, max_value=36)
    purpose = serializers.ChoiceField(choices=LoanPurpose.choices)
    applicant_notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
