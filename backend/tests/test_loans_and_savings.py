import pytest
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from apps.accounts.models import User, UserRole
from apps.loans.models import LoanApplication, LoanStatus
from apps.savings.models import SavingsGoal, SavingsCircle, SavingsCircleMembership, MemberRole, PayoutStatus, CirclePayout
from apps.banking.models import BankAccount, AccountType, AccountStatus

@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='john@smartbank.local',
        email='john@smartbank.local',
        password='Password123!',
        role=UserRole.CUSTOMER
    )

@pytest.fixture
def leader_user(db):
    return User.objects.create_user(
        username='leader@smartbank.local',
        email='leader@smartbank.local',
        password='Password123!',
        role=UserRole.CUSTOMER
    )

@pytest.mark.django_db
def test_loan_payment_calculation():
    # Principal R10,000, 2.5% monthly, 6 months
    pmt, total = LoanApplication.calculate_payment(Decimal('10000.00'), Decimal('0.025'), 6, Decimal('50.00'))
    assert pmt > Decimal('1666.66') # Greater than principal/months due to interest
    assert total > Decimal('10050.00')

    # Zero interest test
    zero_pmt, zero_total = LoanApplication.calculate_payment(Decimal('6000.00'), Decimal('0.000'), 6, Decimal('0.00'))
    assert zero_pmt == Decimal('1000.00')
    assert zero_total == Decimal('6000.00')

@pytest.mark.django_db
def test_savings_goal_progress(user):
    goal = SavingsGoal.objects.create(
        user=user,
        name='Holiday savings',
        target_amount=Decimal('5000.00'),
        current_amount=Decimal('2500.00'),
        target_date=timezone.now().date() + timedelta(days=90)
    )

    assert goal.progress_percentage == 50.0
    assert goal.remaining_amount == Decimal('2500.00')

@pytest.mark.django_db
def test_circle_membership_and_payout(user, leader_user):
    circle = SavingsCircle.objects.create(
        name='Family Circle',
        creator=leader_user,
        contribution_amount=Decimal('500.00'),
        target_amount=Decimal('10000.00')
    )

    SavingsCircleMembership.objects.create(
        circle=circle, user=leader_user, role=MemberRole.LEADER, is_active=True
    )
    SavingsCircleMembership.objects.create(
        circle=circle, user=user, role=MemberRole.MEMBER, is_active=True
    )

    payout = CirclePayout.objects.create(
        circle=circle,
        recipient=user,
        amount=Decimal('1000.00'),
        round_number=1,
        status=PayoutStatus.PROPOSED
    )

    assert payout.status == PayoutStatus.PROPOSED
    assert circle.memberships.count() == 2
