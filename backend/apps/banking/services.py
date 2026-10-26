import uuid
import secrets
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.banking.models import (
    BankAccount, Transaction, TransactionEntry,
    TransactionType, TransactionStatus, EntryType, AccountStatus, IdempotencyRecord
)
from apps.banking.exceptions import (
    IneligibleAccountError, InsufficientFundsError, InvalidAmountError,
    SameAccountTransferError, TransactionAlreadyReversedError
)
from apps.security.services import FraudWatchService
from apps.notifications.models import Notification, NotificationType

class TransactionService:
    @staticmethod
    def generate_reference(prefix: str = 'TXN') -> str:
        timestamp_str = timezone.now().strftime('%y%m%d%H%M')
        random_str = secrets.token_hex(3).upper()
        return f"{prefix}-{timestamp_str}-{random_str}"

    @classmethod
    def execute_deposit(
        cls, account: BankAccount, amount: Decimal, description: str,
        initiating_user, idempotency_key: str = None
    ) -> Transaction:
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise InvalidAmountError("Deposit amount must be greater than zero.")

        with transaction.atomic():
            # Lock the account for balance update
            locked_acc = BankAccount.objects.select_for_update().get(id=account.id)
            if locked_acc.status != AccountStatus.ACTIVE:
                raise IneligibleAccountError(f"Account {locked_acc.account_number} is {locked_acc.status} and cannot accept deposits.")

            reference = cls.generate_reference('DEP')
            txn = Transaction.objects.create(
                reference=reference,
                transaction_type=TransactionType.DEPOSIT,
                source_account=None,
                destination_account=locked_acc,
                amount=amount,
                currency=locked_acc.currency,
                status=TransactionStatus.COMPLETED,
                description=description or 'Simulated Cash/Card Deposit',
                initiating_user=initiating_user,
                idempotency_key=idempotency_key,
                completed_at=timezone.now()
            )

            new_available = locked_acc.available_balance + amount
            new_ledger = locked_acc.ledger_balance + amount

            locked_acc.available_balance = new_available
            locked_acc.ledger_balance = new_ledger
            locked_acc.save(update_fields=['available_balance', 'ledger_balance', 'updated_at'])

            TransactionEntry.objects.create(
                transaction=txn,
                account=locked_acc,
                entry_type=EntryType.CREDIT,
                amount=amount,
                balance_after=new_available
            )

            # Notification
            Notification.objects.create(
                user=locked_acc.user,
                title="Deposit Credited",
                message=f"Simulated deposit of R{amount:,.2f} received for account {locked_acc.account_number}.",
                notification_type=NotificationType.TRANSACTION,
                action_url=f"/dashboard/accounts/{locked_acc.id}"
            )

            FraudWatchService.inspect_transaction(txn)
            return txn

    @classmethod
    def execute_withdrawal(
        cls, account: BankAccount, amount: Decimal, description: str,
        initiating_user, idempotency_key: str = None
    ) -> Transaction:
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise InvalidAmountError("Withdrawal amount must be greater than zero.")

        with transaction.atomic():
            locked_acc = BankAccount.objects.select_for_update().get(id=account.id)
            if locked_acc.status != AccountStatus.ACTIVE:
                raise IneligibleAccountError(f"Account {locked_acc.account_number} is {locked_acc.status} and cannot process withdrawals.")

            if locked_acc.available_balance < amount:
                raise InsufficientFundsError(
                    f"Insufficient funds: Available balance is R{locked_acc.available_balance:,.2f}, required R{amount:,.2f}."
                )

            reference = cls.generate_reference('WTH')
            txn = Transaction.objects.create(
                reference=reference,
                transaction_type=TransactionType.WITHDRAWAL,
                source_account=locked_acc,
                destination_account=None,
                amount=amount,
                currency=locked_acc.currency,
                status=TransactionStatus.COMPLETED,
                description=description or 'Simulated ATM/Branch Withdrawal',
                initiating_user=initiating_user,
                idempotency_key=idempotency_key,
                completed_at=timezone.now()
            )

            new_available = locked_acc.available_balance - amount
            new_ledger = locked_acc.ledger_balance - amount

            locked_acc.available_balance = new_available
            locked_acc.ledger_balance = new_ledger
            locked_acc.save(update_fields=['available_balance', 'ledger_balance', 'updated_at'])

            TransactionEntry.objects.create(
                transaction=txn,
                account=locked_acc,
                entry_type=EntryType.DEBIT,
                amount=amount,
                balance_after=new_available
            )

            Notification.objects.create(
                user=locked_acc.user,
                title="Withdrawal Processed",
                message=f"Simulated withdrawal of R{amount:,.2f} from account {locked_acc.account_number}.",
                notification_type=NotificationType.TRANSACTION,
                action_url=f"/dashboard/accounts/{locked_acc.id}"
            )

            FraudWatchService.inspect_transaction(txn)
            return txn

    @classmethod
    def execute_transfer(
        cls, source_account: BankAccount, destination_account: BankAccount,
        amount: Decimal, description: str, initiating_user, idempotency_key: str = None
    ) -> Transaction:
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise InvalidAmountError("Transfer amount must be greater than zero.")

        if source_account.id == destination_account.id:
            raise SameAccountTransferError("Cannot transfer funds to the same account.")

        with transaction.atomic():
            # Deadlock prevention: sort accounts by UUID before acquiring row locks
            acc_ids = sorted([source_account.id, destination_account.id])
            locked_accounts = {
                acc.id: acc
                for acc in BankAccount.objects.select_for_update().filter(id__in=acc_ids)
            }
            src = locked_accounts[source_account.id]
            dst = locked_accounts[destination_account.id]

            if src.status != AccountStatus.ACTIVE:
                raise IneligibleAccountError(f"Source account {src.account_number} is {src.status}.")
            if dst.status != AccountStatus.ACTIVE:
                raise IneligibleAccountError(f"Destination account {dst.account_number} is {dst.status}.")

            if src.available_balance < amount:
                raise InsufficientFundsError(
                    f"Insufficient funds: Available balance R{src.available_balance:,.2f} is less than transfer amount R{amount:,.2f}."
                )

            reference = cls.generate_reference('TRF')
            txn = Transaction.objects.create(
                reference=reference,
                transaction_type=TransactionType.TRANSFER,
                source_account=src,
                destination_account=dst,
                amount=amount,
                currency=src.currency,
                status=TransactionStatus.COMPLETED,
                description=description or f"Transfer from {src.account_number} to {dst.account_number}",
                initiating_user=initiating_user,
                idempotency_key=idempotency_key,
                completed_at=timezone.now()
            )

            # Update Source
            src_available = src.available_balance - amount
            src_ledger = src.ledger_balance - amount
            src.available_balance = src_available
            src.ledger_balance = src_ledger
            src.save(update_fields=['available_balance', 'ledger_balance', 'updated_at'])

            # Update Destination
            dst_available = dst.available_balance + amount
            dst_ledger = dst.ledger_balance + amount
            dst.available_balance = dst_available
            dst.ledger_balance = dst_ledger
            dst.save(update_fields=['available_balance', 'ledger_balance', 'updated_at'])

            # Create Double-Entry Ledger Records
            TransactionEntry.objects.create(
                transaction=txn,
                account=src,
                entry_type=EntryType.DEBIT,
                amount=amount,
                balance_after=src_available
            )
            TransactionEntry.objects.create(
                transaction=txn,
                account=dst,
                entry_type=EntryType.CREDIT,
                amount=amount,
                balance_after=dst_available
            )

            # Notifications for both parties
            Notification.objects.create(
                user=src.user,
                title="Transfer Sent",
                message=f"R{amount:,.2f} transferred to account {dst.account_number}.",
                notification_type=NotificationType.TRANSACTION,
                action_url=f"/dashboard/accounts/{src.id}"
            )
            if dst.user != src.user:
                Notification.objects.create(
                    user=dst.user,
                    title="Funds Received",
                    message=f"Received R{amount:,.2f} from {src.account_number}.",
                    notification_type=NotificationType.TRANSACTION,
                    action_url=f"/dashboard/accounts/{dst.id}"
                )

            FraudWatchService.inspect_transaction(txn)
            return txn

    @classmethod
    def execute_reversal(cls, original_txn: Transaction, reason: str, initiating_user) -> Transaction:
        with transaction.atomic():
            locked_txn = Transaction.objects.select_for_update().get(id=original_txn.id)
            if locked_txn.status == TransactionStatus.REVERSED:
                raise TransactionAlreadyReversedError("This transaction has already been reversed.")

            if locked_txn.status != TransactionStatus.COMPLETED:
                raise BankingException("Only completed transactions can be reversed.")

            # Reverse based on transaction type
            rev_reference = cls.generate_reference('REV')
            rev_txn = Transaction.objects.create(
                reference=rev_reference,
                transaction_type=TransactionType.REVERSAL,
                source_account=locked_txn.destination_account,
                destination_account=locked_txn.source_account,
                amount=locked_txn.amount,
                currency=locked_txn.currency,
                status=TransactionStatus.COMPLETED,
                description=f"Reversal of {locked_txn.reference}: {reason}",
                initiating_user=initiating_user,
                reversal_of=locked_txn,
                completed_at=timezone.now()
            )

            if locked_txn.transaction_type == TransactionType.TRANSFER:
                src = locked_txn.source_account
                dst = locked_txn.destination_account

                # Destination debited, Source credited
                dst.available_balance -= locked_txn.amount
                dst.ledger_balance -= locked_txn.amount
                dst.save()

                src.available_balance += locked_txn.amount
                src.ledger_balance += locked_txn.amount
                src.save()

                TransactionEntry.objects.create(
                    transaction=rev_txn,
                    account=dst,
                    entry_type=EntryType.DEBIT,
                    amount=locked_txn.amount,
                    balance_after=dst.available_balance
                )
                TransactionEntry.objects.create(
                    transaction=rev_txn,
                    account=src,
                    entry_type=EntryType.CREDIT,
                    amount=locked_txn.amount,
                    balance_after=src.available_balance
                )
            elif locked_txn.transaction_type == TransactionType.DEPOSIT:
                dst = locked_txn.destination_account
                dst.available_balance -= locked_txn.amount
                dst.ledger_balance -= locked_txn.amount
                dst.save()
                TransactionEntry.objects.create(
                    transaction=rev_txn,
                    account=dst,
                    entry_type=EntryType.DEBIT,
                    amount=locked_txn.amount,
                    balance_after=dst.available_balance
                )

            locked_txn.status = TransactionStatus.REVERSED
            locked_txn.save(update_fields=['status'])

            return rev_txn
