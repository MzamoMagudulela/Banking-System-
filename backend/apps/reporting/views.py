import csv
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate
from rest_framework import views, status
from rest_framework.response import Response

from apps.accounts.permissions import IsStaffUser
from apps.accounts.models import User, UserRole
from apps.banking.models import BankAccount, Transaction, AccountStatus, TransactionStatus
from apps.loans.models import LoanApplication, LoanStatus
from apps.security.models import SecurityAlert, AlertStatus
from apps.support.models import SupportTicket, TicketStatus
from apps.savings.models import SavingsGoal, SavingsCircle

def sanitize_csv_cell(val):
    """Prevent CSV Formula Injection (CWE-1236) by prepending a single quote if cell starts with dangerous prefix."""
    s = str(val or '')
    if s.startswith(('=', '+', '-', '@', '\t', '\r')):
        return "'" + s
    return s

class InstitutionalOverviewView(views.APIView):
    """Institutional real-time operational overview for staff & management."""
    permission_classes = [IsStaffUser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_customers = User.objects.filter(role=UserRole.CUSTOMER).count()
        verified_customers = User.objects.filter(role=UserRole.CUSTOMER, is_verified=True).count()
        unverified_customers = total_customers - verified_customers

        total_accounts = BankAccount.objects.count()
        active_accounts = BankAccount.objects.filter(status=AccountStatus.ACTIVE).count()
        suspended_accounts = BankAccount.objects.filter(status=AccountStatus.SUSPENDED).count()

        total_liquidity = BankAccount.objects.filter(status=AccountStatus.ACTIVE).aggregate(
            total=Sum('available_balance')
        )['total'] or Decimal('0.00')

        tx_stats = Transaction.objects.filter(status=TransactionStatus.COMPLETED).aggregate(
            total_count=Count('id'),
            total_volume=Sum('amount')
        )

        pending_loans = LoanApplication.objects.filter(status=LoanStatus.SUBMITTED).count()
        open_tickets = SupportTicket.objects.filter(status__in=[TicketStatus.OPEN, TicketStatus.IN_PROGRESS]).count()
        unresolved_alerts = SecurityAlert.objects.filter(status__in=[AlertStatus.TRIGGERED, AlertStatus.INVESTIGATING]).count()

        # 14-day transaction volume trend (aggregated from real DB transactions)
        fourteen_days_ago = now.date() - timedelta(days=14)
        daily_tx = (
            Transaction.objects.filter(
                status=TransactionStatus.COMPLETED,
                created_at__date__gte=fourteen_days_ago
            )
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'), volume=Sum('amount'))
            .order_by('date')
        )

        trend_data = []
        for entry in daily_tx:
            trend_data.append({
                'date': entry['date'].strftime('%b %d'),
                'count': entry['count'],
                'volume': float(entry['volume'] or 0)
            })

        # Loan Status Distribution
        loan_dist = (
            LoanApplication.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )

        # Community circles stats
        active_circles = SavingsCircle.objects.count()

        return Response({
            'metrics': {
                'total_customers': total_customers,
                'verified_customers': verified_customers,
                'unverified_customers': unverified_customers,
                'total_accounts': total_accounts,
                'active_accounts': active_accounts,
                'suspended_accounts': suspended_accounts,
                'total_liquidity': str(total_liquidity),
                'total_transactions_count': tx_stats['total_count'] or 0,
                'total_transactions_volume': str(tx_stats['total_volume'] or Decimal('0.00')),
                'pending_loans': pending_loans,
                'open_support_tickets': open_tickets,
                'unresolved_security_alerts': unresolved_alerts,
                'active_savings_circles': active_circles,
            },
            'transaction_trends': trend_data,
            'loan_distribution': list(loan_dist)
        })


class ExportTransactionsCsvView(views.APIView):
    """Staff only: export filtered transactions as a clean, injection-safe CSV file."""
    permission_classes = [IsStaffUser]

    def get(self, request):
        txs = Transaction.objects.select_related('source_account', 'destination_account', 'initiating_user').all()[:1000]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="smartbank_transactions_{timezone.now():%Y%m%d%H%M}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Reference', 'Type', 'Amount (ZAR)', 'Status',
            'Source Account', 'Destination Account', 'Initiator',
            'Description', 'Date'
        ])

        for tx in txs:
            src = tx.source_account.account_number if tx.source_account else 'N/A'
            dst = tx.destination_account.account_number if tx.destination_account else 'N/A'
            writer.writerow([
                sanitize_csv_cell(tx.reference),
                sanitize_csv_cell(tx.transaction_type),
                sanitize_csv_cell(tx.amount),
                sanitize_csv_cell(tx.status),
                sanitize_csv_cell(src),
                sanitize_csv_cell(dst),
                sanitize_csv_cell(tx.initiating_user.email),
                sanitize_csv_cell(tx.description),
                sanitize_csv_cell(tx.created_at.strftime('%Y-%m-%d %H:%M:%S'))
            ])

        return response
