from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from apps.security.models import SecurityAlert, AlertSeverity, AlertStatus, SecurityRuleConfig

class FraudWatchService:
    @staticmethod
    def inspect_transaction(transaction):
        """
        Runs deterministic, explainable rule checks against a created transaction.
        Creates SecurityAlert records if triggered, without blocking simulated demo transactions.
        """
        alerts = []
        user = transaction.initiating_user
        account = transaction.source_account or transaction.destination_account

        # Rule 1: High-value transaction threshold
        high_threshold = Decimal('25000.00')
        config = SecurityRuleConfig.objects.filter(rule_key='HIGH_AMOUNT_THRESHOLD', is_enabled=True).first()
        if config:
            high_threshold = config.threshold_value

        if transaction.amount >= high_threshold:
            alert = SecurityAlert.objects.create(
                user=user,
                account=account,
                transaction=transaction,
                rule_name='High Value Transaction Threshold',
                severity=AlertSeverity.HIGH if transaction.amount < Decimal('50000.00') else AlertSeverity.CRITICAL,
                status=AlertStatus.TRIGGERED,
                description=f"Transaction {transaction.reference} for R{transaction.amount} exceeded the high-amount demonstration threshold of R{high_threshold}.",
                evidence_details={
                    'threshold': str(high_threshold),
                    'actual_amount': str(transaction.amount),
                    'transaction_type': transaction.transaction_type,
                }
            )
            alerts.append(alert)

        # Rule 2: Velocity / Rapid transaction check
        if account:
            window_start = timezone.now() - timedelta(minutes=5)
            from apps.banking.models import Transaction
            recent_tx_count = Transaction.objects.filter(
                models_source=account,
                created_at__gte=window_start
            ).count() if hasattr(Transaction.objects, 'models_source') else Transaction.objects.filter(
                source_account=account,
                created_at__gte=window_start
            ).count()

            if recent_tx_count >= 4:
                alert = SecurityAlert.objects.create(
                    user=user,
                    account=account,
                    transaction=transaction,
                    rule_name='Rapid Transaction Velocity (5-min window)',
                    severity=AlertSeverity.MEDIUM,
                    status=AlertStatus.TRIGGERED,
                    description=f"Account {account.account_number} had {recent_tx_count} transactions within 5 minutes.",
                    evidence_details={
                        'window_minutes': 5,
                        'transaction_count': recent_tx_count,
                    }
                )
                alerts.append(alert)

        return alerts
