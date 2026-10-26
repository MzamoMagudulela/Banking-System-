from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework import views, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action

from apps.loans.models import LoanApplication, LoanRepayment, LoanStatus, RepaymentStatus
from apps.loans.serializers import (
    LoanApplicationSerializer, LoanCalculateRequestSerializer,
    LoanApplyRequestSerializer, LoanRepaymentSerializer
)
from apps.banking.models import BankAccount, AccountStatus
from apps.banking.services import TransactionService
from apps.accounts.permissions import IsStaffUser
from apps.accounts.views import record_audit
from apps.notifications.models import Notification, NotificationType

class LoanCalculateView(views.APIView):
    """Public or customer transparent loan payment calculator."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoanCalculateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        principal = data['amount']
        months = data['term_months']
        rate = data.get('monthly_interest_rate', Decimal('0.0250'))
        fee = data.get('origination_fee', Decimal('50.00'))

        monthly_pmt, total_pmt = LoanApplication.calculate_payment(principal, rate, months, fee)
        total_interest = total_pmt - principal - fee

        # Build illustrative schedule
        schedule = []
        balance = principal
        start_date = timezone.now().date()
        for i in range(1, months + 1):
            due_date = start_date + timedelta(days=30 * i)
            schedule.append({
                'installment_number': i,
                'due_date': due_date.isoformat(),
                'amount': str(monthly_pmt),
            })

        return Response({
            'principal': str(principal),
            'term_months': months,
            'monthly_interest_rate': str(rate),
            'monthly_payment': str(monthly_pmt),
            'total_interest': str(total_interest),
            'origination_fee': str(fee),
            'total_repayment': str(total_pmt),
            'schedule': schedule,
            'disclaimer': 'Illustrative transparent calculation for SmartBank community microloan simulation.'
        })


class LoanApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = LoanApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = LoanApplication.objects.select_related('user', 'disbursement_account', 'reviewed_by').prefetch_related('repayments')
        if not user.is_bank_staff():
            qs = qs.filter(user=user)

        st = self.request.query_params.get('status')
        if st:
            qs = qs.filter(status=st)
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = LoanApplyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        account = BankAccount.objects.filter(id=data['disbursement_account_id'], user=request.user).first()
        if not account or account.status != AccountStatus.ACTIVE:
            return Response({'error': 'Please select an active account for disbursement.'}, status=status.HTTP_400_BAD_REQUEST)

        principal = data['amount']
        months = data['term_months']
        rate = Decimal('0.0250') # 2.5% monthly standard rate
        fee = Decimal('50.00')

        monthly_pmt, total_pmt = LoanApplication.calculate_payment(principal, rate, months, fee)

        loan = LoanApplication.objects.create(
            user=request.user,
            disbursement_account=account,
            purpose=data['purpose'],
            amount_requested=principal,
            term_months=months,
            monthly_interest_rate=rate,
            origination_fee=fee,
            calculated_monthly_payment=monthly_pmt,
            total_repayment_amount=total_pmt,
            applicant_notes=data.get('applicant_notes', ''),
            status=LoanStatus.SUBMITTED
        )

        record_audit(request, 'SUBMIT_LOAN_APPLICATION', 'LoanApplication', loan.id, {'amount': str(principal)})
        Notification.objects.create(
            user=request.user,
            title="Loan Application Submitted",
            message=f"Your microloan application for R{principal:,.2f} has been submitted for bank review.",
            notification_type=NotificationType.LOAN,
            action_url=f"/dashboard/loans/{loan.id}"
        )

        return Response(LoanApplicationSerializer(loan).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def decision(self, request, pk=None):
        loan = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        staff_notes = request.data.get('staff_notes', '')

        if new_status not in [LoanStatus.APPROVED, LoanStatus.REJECTED]:
            return Response({'error': 'Decision must be APPROVED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            loan.status = new_status
            loan.decision_reason = reason
            loan.staff_notes = staff_notes
            loan.reviewed_by = request.user
            loan.reviewed_at = timezone.now()

            if new_status == LoanStatus.APPROVED:
                # Disburse funds into customer account
                txn = TransactionService.execute_deposit(
                    account=loan.disbursement_account,
                    amount=loan.amount_requested,
                    description=f"Loan Disbursement: {loan.get_purpose_display()}",
                    initiating_user=request.user
                )
                loan.disbursement_transaction = txn
                loan.disbursed_at = timezone.now()
                loan.status = LoanStatus.DISBURSED

                # Generate repayment schedule records
                start_date = timezone.now().date()
                for i in range(1, loan.term_months + 1):
                    due_date = start_date + timedelta(days=30 * i)
                    LoanRepayment.objects.create(
                        loan=loan,
                        installment_number=i,
                        amount_due=loan.calculated_monthly_payment,
                        due_date=due_date,
                        status=RepaymentStatus.SCHEDULED
                    )

            loan.save()

            Notification.objects.create(
                user=loan.user,
                title=f"Loan Application {new_status}",
                message=f"Your loan application for R{loan.amount_requested:,.2f} was {new_status.lower()}: {reason}",
                notification_type=NotificationType.LOAN,
                action_url=f"/dashboard/loans/{loan.id}"
            )

        record_audit(request, f'LOAN_DECISION_{new_status}', 'LoanApplication', loan.id, {'reason': reason})
        return Response(LoanApplicationSerializer(loan).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def request_info(self, request, pk=None):
        loan = self.get_object()
        info_prompt = request.data.get('notes', 'Please provide additional verification details.')
        loan.status = LoanStatus.INFO_REQUESTED
        loan.staff_notes = info_prompt
        loan.save(update_fields=['status', 'staff_notes'])

        Notification.objects.create(
            user=loan.user,
            title="Additional Loan Information Requested",
            message=info_prompt,
            notification_type=NotificationType.LOAN,
            action_url=f"/dashboard/loans/{loan.id}"
        )
        record_audit(request, 'LOAN_REQUEST_INFO', 'LoanApplication', loan.id)
        return Response(LoanApplicationSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def repay(self, request, pk=None):
        loan = self.get_object()
        user = request.user
        if loan.user != user and not user.is_bank_staff():
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        account_id = request.data.get('account_id')
        source_account = BankAccount.objects.filter(id=account_id, user=user).first()
        if not source_account:
            return Response({'error': 'Invalid repayment account.'}, status=status.HTTP_400_BAD_REQUEST)

        installment = loan.repayments.filter(status=RepaymentStatus.SCHEDULED).first()
        if not installment:
            return Response({'error': 'No pending installments found.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = installment.amount_due
        with transaction.atomic():
            try:
                txn = TransactionService.execute_withdrawal(
                    account=source_account,
                    amount=amount,
                    description=f"Loan Repayment #{installment.installment_number} ({loan.id.hex[:8]})",
                    initiating_user=user
                )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            installment.status = RepaymentStatus.PAID
            installment.amount_paid = amount
            installment.paid_date = timezone.now().date()
            installment.transaction = txn
            installment.save()

            # Check if all installments paid
            if not loan.repayments.filter(status=RepaymentStatus.SCHEDULED).exists():
                loan.status = LoanStatus.CLOSED
                loan.save(update_fields=['status'])

        record_audit(request, 'REPAY_LOAN_INSTALLMENT', 'LoanRepayment', installment.id, {'amount': str(amount)})
        return Response({
            'message': f"Installment #{installment.installment_number} paid successfully.",
            'loan': LoanApplicationSerializer(loan).data
        })
