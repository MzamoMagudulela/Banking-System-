import pytest
from decimal import Decimal
from apps.accounts.models import User, UserRole
from apps.banking.models import BankAccount, AccountType, AccountStatus, TransactionStatus, EntryType
from apps.banking.services import TransactionService
from apps.banking.exceptions import (
    InsufficientFundsError, InvalidAmountError, SameAccountTransferError, IneligibleAccountError
)

@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        username='sipho',
        email='sipho@smartbank.local',
        password='Password123!',
        first_name='Sipho',
        last_name='Dlamini',
        role=UserRole.CUSTOMER
    )

@pytest.fixture
def recipient_user(db):
    return User.objects.create_user(
        username='lerato',
        email='lerato@smartbank.local',
        password='Password123!',
        first_name='Lerato',
        last_name='Mokoena',
        role=UserRole.CUSTOMER
    )

@pytest.fixture
def account_a(db, test_user):
    return BankAccount.objects.create(
        account_number='SB-10000001',
        user=test_user,
        account_type=AccountType.SAVINGS,
        status=AccountStatus.ACTIVE,
        available_balance=Decimal('1000.00'),
        ledger_balance=Decimal('1000.00'),
    )

@pytest.fixture
def account_b(db, recipient_user):
    return BankAccount.objects.create(
        account_number='SB-10000002',
        user=recipient_user,
        account_type=AccountType.CURRENT,
        status=AccountStatus.ACTIVE,
        available_balance=Decimal('250.00'),
        ledger_balance=Decimal('250.00'),
    )

@pytest.mark.django_db
def test_successful_transfer(account_a, account_b, test_user):
    txn = TransactionService.execute_transfer(
        source_account=account_a,
        destination_account=account_b,
        amount=Decimal('300.00'),
        description='Monthly grocery share',
        initiating_user=test_user
    )

    assert txn.status == TransactionStatus.COMPLETED
    assert txn.amount == Decimal('300.00')

    account_a.refresh_from_db()
    account_b.refresh_from_db()

    assert account_a.available_balance == Decimal('700.00')
    assert account_b.available_balance == Decimal('550.00')

    # Verify double-entry ledger entries
    entries = txn.ledger_entries.all()
    assert entries.count() == 2

    debit_entry = entries.get(entry_type=EntryType.DEBIT)
    assert debit_entry.account == account_a
    assert debit_entry.amount == Decimal('300.00')
    assert debit_entry.balance_after == Decimal('700.00')

    credit_entry = entries.get(entry_type=EntryType.CREDIT)
    assert credit_entry.account == account_b
    assert credit_entry.amount == Decimal('300.00')
    assert credit_entry.balance_after == Decimal('550.00')

@pytest.mark.django_db
def test_insufficient_funds_transfer(account_a, account_b, test_user):
    with pytest.raises(InsufficientFundsError):
        TransactionService.execute_transfer(
            source_account=account_a,
            destination_account=account_b,
            amount=Decimal('1500.00'),
            description='Should fail',
            initiating_user=test_user
        )

    account_a.refresh_from_db()
    account_b.refresh_from_db()
    assert account_a.available_balance == Decimal('1000.00')
    assert account_b.available_balance == Decimal('250.00')

@pytest.mark.django_db
def test_negative_and_zero_amounts(account_a, account_b, test_user):
    with pytest.raises(InvalidAmountError):
        TransactionService.execute_transfer(
            source_account=account_a,
            destination_account=account_b,
            amount=Decimal('-50.00'),
            description='Negative',
            initiating_user=test_user
        )

    with pytest.raises(InvalidAmountError):
        TransactionService.execute_deposit(
            account=account_a,
            amount=Decimal('0.00'),
            description='Zero',
            initiating_user=test_user
        )

@pytest.mark.django_db
def test_same_account_transfer(account_a, test_user):
    with pytest.raises(SameAccountTransferError):
        TransactionService.execute_transfer(
            source_account=account_a,
            destination_account=account_a,
            amount=Decimal('100.00'),
            description='Self transfer',
            initiating_user=test_user
        )

@pytest.mark.django_db
def test_suspended_account_transfer(account_a, account_b, test_user):
    account_b.status = AccountStatus.SUSPENDED
    account_b.save()

    with pytest.raises(IneligibleAccountError):
        TransactionService.execute_transfer(
            source_account=account_a,
            destination_account=account_b,
            amount=Decimal('100.00'),
            description='To suspended account',
            initiating_user=test_user
        )

@pytest.mark.django_db
def test_deposit_and_withdrawal(account_a, test_user):
    # Deposit
    dep_txn = TransactionService.execute_deposit(
        account=account_a,
        amount=Decimal('500.00'),
        description='Paycheck topup',
        initiating_user=test_user
    )
    assert dep_txn.status == TransactionStatus.COMPLETED
    account_a.refresh_from_db()
    assert account_a.available_balance == Decimal('1500.00')

    # Withdrawal
    wth_txn = TransactionService.execute_withdrawal(
        account=account_a,
        amount=Decimal('200.00'),
        description='Cash withdrawal',
        initiating_user=test_user
    )
    assert wth_txn.status == TransactionStatus.COMPLETED
    account_a.refresh_from_db()
    assert account_a.available_balance == Decimal('1300.00')

@pytest.mark.django_db
def test_transaction_reversal(account_a, account_b, test_user):
    txn = TransactionService.execute_transfer(
        source_account=account_a,
        destination_account=account_b,
        amount=Decimal('200.00'),
        description='Mistaken transfer',
        initiating_user=test_user
    )

    account_a.refresh_from_db()
    account_b.refresh_from_db()
    assert account_a.available_balance == Decimal('800.00')
    assert account_b.available_balance == Decimal('450.00')

    # Reverse transaction
    rev = TransactionService.execute_reversal(
        original_txn=txn,
        reason='Customer requested correction within 5 mins',
        initiating_user=test_user
    )

    assert rev.status == TransactionStatus.COMPLETED
    account_a.refresh_from_db()
    account_b.refresh_from_db()
    assert account_a.available_balance == Decimal('1000.00')
    assert account_b.available_balance == Decimal('250.00')
