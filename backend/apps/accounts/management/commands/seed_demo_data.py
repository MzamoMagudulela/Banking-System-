from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, UserRole, CustomerProfile, KycStatus, AuditEvent
from apps.banking.models import BankAccount, AccountType, AccountStatus, Transaction, TransactionStatus, TransactionType, EntryType, TransactionEntry
from apps.banking.services import TransactionService
from apps.savings.models import (
    SavingsGoal, SavingsContribution, SavingsCircle, SavingsCircleMembership,
    CircleContribution, CirclePayout, GoalCategory, GoalStatus, MemberRole, PayoutStatus, CircleFrequency
)
from apps.loans.models import LoanApplication, LoanRepayment, LoanStatus, LoanPurpose, RepaymentStatus
from apps.security.models import SecurityAlert, AlertSeverity, AlertStatus, SecurityRuleConfig
from apps.notifications.models import Notification, NotificationType
from apps.support.models import SupportTicket, SupportMessage, TicketCategory, TicketPriority, TicketStatus

class Command(BaseCommand):
    help = 'Seeds realistic, fictional demonstration banking data for SmartBank local development.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Clearing existing demonstration data..."))
        # Clear existing models
        SupportMessage.objects.all().delete()
        SupportTicket.objects.all().delete()
        Notification.objects.all().delete()
        SecurityAlert.objects.all().delete()
        LoanRepayment.objects.all().delete()
        LoanApplication.objects.all().delete()
        CirclePayout.objects.all().delete()
        CircleContribution.objects.all().delete()
        SavingsCircleMembership.objects.all().delete()
        SavingsCircle.objects.all().delete()
        SavingsContribution.objects.all().delete()
        SavingsGoal.objects.all().delete()
        TransactionEntry.objects.all().delete()
        Transaction.objects.all().delete()
        BankAccount.objects.all().delete()
        CustomerProfile.objects.all().delete()
        AuditEvent.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write(self.style.NOTICE("Creating default security rule configurations..."))
        SecurityRuleConfig.objects.create(
            rule_key='HIGH_AMOUNT_THRESHOLD',
            name='High Value Transaction Threshold',
            description='Triggers review when transaction amount exceeds R25,000 in a single operation.',
            threshold_value=Decimal('25000.00'),
            is_enabled=True,
            severity=AlertSeverity.HIGH
        )
        SecurityRuleConfig.objects.create(
            rule_key='RAPID_VELOCITY',
            name='Rapid Velocity Check',
            description='Flags accounts initiating 4 or more transactions within 5 minutes.',
            threshold_value=Decimal('4.00'),
            is_enabled=True,
            severity=AlertSeverity.MEDIUM
        )

        self.stdout.write(self.style.NOTICE("Creating demonstration users..."))
        # 1. Administrator
        admin_user = User.objects.create_superuser(
            username='admin@smartbank.local',
            email='admin@smartbank.local',
            password='AdminPassword123!',
            first_name='Nomvula',
            last_name='Khumalo',
            role=UserRole.ADMIN,
            is_verified=True,
            preferred_language='en'
        )

        # 2. Staff Member
        staff_user = User.objects.create_user(
            username='staff@smartbank.local',
            email='staff@smartbank.local',
            password='StaffPassword123!',
            first_name='Thabo',
            last_name='Ndlovu',
            role=UserRole.STAFF,
            is_verified=True,
            preferred_language='en'
        )

        # 3. Primary Customer (Sipho)
        customer_sipho = User.objects.create_user(
            username='customer@smartbank.local',
            email='customer@smartbank.local',
            password='CustomerPassword123!',
            first_name='Sipho',
            last_name='Dlamini',
            role=UserRole.CUSTOMER,
            is_verified=True,
            phone_number='+27 82 555 0192',
            preferred_language='en'
        )
        CustomerProfile.objects.create(
            user=customer_sipho,
            date_of_birth=date(1991, 5, 14),
            residential_address='42 Vilakazi Street, Orlando West',
            city='Soweto',
            province='Gauteng',
            postal_code='1804',
            employment_status='EMPLOYED',
            monthly_income=Decimal('28500.00'),
            kyc_status=KycStatus.VERIFIED,
            verification_notes='Verified via proof of residence and employer payslip.',
            verified_by=staff_user,
            verified_at=timezone.now() - timedelta(days=60)
        )

        # 4. Secondary Customer (Lerato)
        customer_lerato = User.objects.create_user(
            username='lerato@smartbank.local',
            email='lerato@smartbank.local',
            password='CustomerPassword123!',
            first_name='Lerato',
            last_name='Mokoena',
            role=UserRole.CUSTOMER,
            is_verified=True,
            phone_number='+27 71 555 4321',
            preferred_language='zu'
        )
        CustomerProfile.objects.create(
            user=customer_lerato,
            date_of_birth=date(1994, 8, 22),
            residential_address='18 Makhabeni Crescent',
            city='Durban',
            province='KwaZulu-Natal',
            postal_code='4001',
            employment_status='SELF_EMPLOYED',
            monthly_income=Decimal('19500.00'),
            kyc_status=KycStatus.VERIFIED,
            verified_by=staff_user,
            verified_at=timezone.now() - timedelta(days=45)
        )

        # 5. Tertiary Customer (Bongani)
        customer_bongani = User.objects.create_user(
            username='bongani@smartbank.local',
            email='bongani@smartbank.local',
            password='CustomerPassword123!',
            first_name='Bongani',
            last_name='Zulu',
            role=UserRole.CUSTOMER,
            is_verified=False,
            phone_number='+27 83 555 7890',
            preferred_language='en'
        )
        CustomerProfile.objects.create(
            user=customer_bongani,
            date_of_birth=date(1988, 11, 3),
            residential_address='77 Fox Street, Marshalltown',
            city='Johannesburg',
            province='Gauteng',
            postal_code='2001',
            employment_status='INFORMAL',
            monthly_income=Decimal('14000.00'),
            kyc_status=KycStatus.PENDING,
            verification_notes='Submitted proof of residence pending utility bill verification.'
        )

        self.stdout.write(self.style.NOTICE("Creating bank accounts & transactions..."))
        # Sipho's accounts
        sipho_savings = BankAccount.objects.create(
            account_number='SB-10293847',
            user=customer_sipho,
            account_type=AccountType.SAVINGS,
            status=AccountStatus.ACTIVE,
            available_balance=Decimal('14500.00'),
            ledger_balance=Decimal('14500.00')
        )
        sipho_current = BankAccount.objects.create(
            account_number='SB-55667788',
            user=customer_sipho,
            account_type=AccountType.CURRENT,
            status=AccountStatus.ACTIVE,
            available_balance=Decimal('3250.00'),
            ledger_balance=Decimal('3250.00')
        )

        # Lerato's account
        lerato_savings = BankAccount.objects.create(
            account_number='SB-99887766',
            user=customer_lerato,
            account_type=AccountType.SAVINGS,
            status=AccountStatus.ACTIVE,
            available_balance=Decimal('8800.00'),
            ledger_balance=Decimal('8800.00')
        )

        # Bongani's account
        bongani_savings = BankAccount.objects.create(
            account_number='SB-33445566',
            user=customer_bongani,
            account_type=AccountType.SAVINGS,
            status=AccountStatus.ACTIVE,
            available_balance=Decimal('31500.00'),
            ledger_balance=Decimal('31500.00')
        )

        # Record seed transactions with double-entry ledger entries
        now = timezone.now()
        # Seed TX 1: Deposit for Sipho
        t1 = Transaction.objects.create(
            reference='DEP-261001-A1B',
            transaction_type=TransactionType.DEPOSIT,
            destination_account=sipho_savings,
            amount=Decimal('10000.00'),
            status=TransactionStatus.COMPLETED,
            description='Monthly Salary Deposit (Simulated)',
            initiating_user=customer_sipho,
            created_at=now - timedelta(days=12),
            completed_at=now - timedelta(days=12)
        )
        TransactionEntry.objects.create(
            transaction=t1, account=sipho_savings, entry_type=EntryType.CREDIT,
            amount=Decimal('10000.00'), balance_after=Decimal('10000.00'),
            timestamp=now - timedelta(days=12)
        )

        # Seed TX 2: Transfer from Sipho to Lerato
        t2 = Transaction.objects.create(
            reference='TRF-261005-C3D',
            transaction_type=TransactionType.TRANSFER,
            source_account=sipho_savings,
            destination_account=lerato_savings,
            amount=Decimal('750.00'),
            status=TransactionStatus.COMPLETED,
            description='Community market stall rental share',
            initiating_user=customer_sipho,
            created_at=now - timedelta(days=8),
            completed_at=now - timedelta(days=8)
        )
        TransactionEntry.objects.create(
            transaction=t2, account=sipho_savings, entry_type=EntryType.DEBIT,
            amount=Decimal('750.00'), balance_after=Decimal('9250.00'),
            timestamp=now - timedelta(days=8)
        )
        TransactionEntry.objects.create(
            transaction=t2, account=lerato_savings, entry_type=EntryType.CREDIT,
            amount=Decimal('750.00'), balance_after=Decimal('8800.00'),
            timestamp=now - timedelta(days=8)
        )

        # Seed TX 3: Large transaction on Bongani's account triggering demonstration rule
        t3 = Transaction.objects.create(
            reference='DEP-261014-E5F',
            transaction_type=TransactionType.DEPOSIT,
            destination_account=bongani_savings,
            amount=Decimal('30000.00'),
            status=TransactionStatus.COMPLETED,
            description='Wholesale bulk goods sale revenue',
            initiating_user=customer_bongani,
            created_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2)
        )
        TransactionEntry.objects.create(
            transaction=t3, account=bongani_savings, entry_type=EntryType.CREDIT,
            amount=Decimal('30000.00'), balance_after=Decimal('31500.00'),
            timestamp=now - timedelta(days=2)
        )

        # Trigger Security Alert for t3
        SecurityAlert.objects.create(
            user=customer_bongani,
            account=bongani_savings,
            transaction=t3,
            rule_name='High Value Transaction Threshold',
            severity=AlertSeverity.HIGH,
            status=AlertStatus.TRIGGERED,
            description='Transaction DEP-261014-E5F for R30,000.00 exceeded demonstration threshold of R25,000.00.',
            evidence_details={'threshold': '25000.00', 'actual_amount': '30000.00'}
        )

        self.stdout.write(self.style.NOTICE("Creating Smart Savings Coach goals..."))
        # Goal 1: Emergency Fund
        g1 = SavingsGoal.objects.create(
            user=customer_sipho,
            account=sipho_savings,
            name='Emergency Resilience Fund',
            category=GoalCategory.EMERGENCY,
            target_amount=Decimal('20000.00'),
            current_amount=Decimal('12000.00'),
            target_date=timezone.now().date() + timedelta(days=120),
            status=GoalStatus.IN_PROGRESS
        )
        SavingsContribution.objects.create(
            goal=g1, account=sipho_savings, amount=Decimal('4000.00'),
            notes='Initial allocation from bonus savings', timestamp=now - timedelta(days=30)
        )
        SavingsContribution.objects.create(
            goal=g1, account=sipho_savings, amount=Decimal('8000.00'),
            notes='Monthly automated transfer', timestamp=now - timedelta(days=10)
        )

        # Goal 2: Business Stock
        SavingsGoal.objects.create(
            user=customer_sipho,
            account=sipho_current,
            name='Solar Power Backup Setup',
            category=GoalCategory.HOUSING,
            target_amount=Decimal('15000.00'),
            current_amount=Decimal('6500.00'),
            target_date=timezone.now().date() + timedelta(days=75),
            status=GoalStatus.IN_PROGRESS
        )

        self.stdout.write(self.style.NOTICE("Creating Community Savings Circle (Stokvel)..."))
        circle = SavingsCircle.objects.create(
            name='Soweto Entrepreneurs Stokvel',
            description='A collaborative digital savings group supporting local micro-business operators and entrepreneurs in Soweto.',
            creator=customer_sipho,
            target_amount=Decimal('50000.00'),
            contribution_amount=Decimal('1000.00'),
            frequency=CircleFrequency.MONTHLY,
            current_round=3,
            status=AccountStatus.ACTIVE,
            meeting_day='First Sunday of every month at 15:00',
            payout_rule_description='Sequential rotational payout schedule voted by members at the start of each cycle.'
        )

        # Memberships
        m_sipho = SavingsCircleMembership.objects.create(
            circle=circle, user=customer_sipho, role=MemberRole.LEADER, is_active=True
        )
        m_lerato = SavingsCircleMembership.objects.create(
            circle=circle, user=customer_lerato, role=MemberRole.TREASURER, is_active=True
        )
        m_bongani = SavingsCircleMembership.objects.create(
            circle=circle, user=customer_bongani, role=MemberRole.MEMBER, is_active=True
        )

        # Contributions for Rounds 1 and 2
        CircleContribution.objects.create(
            circle=circle, member=customer_sipho, amount=Decimal('1000.00'), round_number=1,
            notes='Round 1 contribution', timestamp=now - timedelta(days=60)
        )
        CircleContribution.objects.create(
            circle=circle, member=customer_lerato, amount=Decimal('1000.00'), round_number=1,
            notes='Round 1 contribution', timestamp=now - timedelta(days=60)
        )
        CircleContribution.objects.create(
            circle=circle, member=customer_bongani, amount=Decimal('1000.00'), round_number=1,
            notes='Round 1 contribution', timestamp=now - timedelta(days=60)
        )

        # Round 1 Payout disbursed to Sipho
        CirclePayout.objects.create(
            circle=circle,
            recipient=customer_sipho,
            amount=Decimal('3000.00'),
            round_number=1,
            status=PayoutStatus.DISBURSED,
            approved_by=customer_lerato,
            notes='Round 1 recipient as per schedule',
            proposed_at=now - timedelta(days=58),
            approved_at=now - timedelta(days=57),
            disbursed_at=now - timedelta(days=57)
        )

        # Round 2 Payout proposed for Lerato
        CirclePayout.objects.create(
            circle=circle,
            recipient=customer_lerato,
            amount=Decimal('3000.00'),
            round_number=2,
            status=PayoutStatus.PROPOSED,
            notes='Round 2 rotational allocation',
            proposed_at=now - timedelta(days=2)
        )

        self.stdout.write(self.style.NOTICE("Creating Microloan Applications..."))
        # Loan 1: Active, Disbursed for Sipho
        l1_pmt, l1_tot = LoanApplication.calculate_payment(Decimal('10000.00'), Decimal('0.0250'), 6, Decimal('50.00'))
        loan_sipho = LoanApplication.objects.create(
            user=customer_sipho,
            disbursement_account=sipho_current,
            purpose=LoanPurpose.EQUIPMENT,
            amount_requested=Decimal('10000.00'),
            term_months=6,
            monthly_interest_rate=Decimal('0.0250'),
            origination_fee=Decimal('50.00'),
            calculated_monthly_payment=l1_pmt,
            total_repayment_amount=l1_tot,
            status=LoanStatus.DISBURSED,
            applicant_notes='Commercial refrigerator for grocery store stock storage.',
            decision_reason='Applicant has steady verifiable income and excellent community standing.',
            reviewed_by=staff_user,
            reviewed_at=now - timedelta(days=40),
            disbursed_at=now - timedelta(days=40)
        )

        # Repayments: 1 paid, 5 scheduled
        LoanRepayment.objects.create(
            loan=loan_sipho, installment_number=1, amount_due=l1_pmt,
            amount_paid=l1_pmt, due_date=timezone.now().date() - timedelta(days=10),
            paid_date=timezone.now().date() - timedelta(days=10),
            status=RepaymentStatus.PAID
        )
        for i in range(2, 7):
            LoanRepayment.objects.create(
                loan=loan_sipho, installment_number=i, amount_due=l1_pmt,
                amount_paid=Decimal('0.00'),
                due_date=timezone.now().date() + timedelta(days=30 * (i - 1)),
                status=RepaymentStatus.SCHEDULED
            )

        # Loan 2: Pending Submitted for Bongani
        l2_pmt, l2_tot = LoanApplication.calculate_payment(Decimal('15000.00'), Decimal('0.0250'), 12, Decimal('50.00'))
        LoanApplication.objects.create(
            user=customer_bongani,
            disbursement_account=bongani_savings,
            purpose=LoanPurpose.BUSINESS_STOCK,
            amount_requested=Decimal('15000.00'),
            term_months=12,
            monthly_interest_rate=Decimal('0.0250'),
            origination_fee=Decimal('50.00'),
            calculated_monthly_payment=l2_pmt,
            total_repayment_amount=l2_tot,
            status=LoanStatus.SUBMITTED,
            applicant_notes='Bulk seasonal produce inventory purchase for trade stand.'
        )

        self.stdout.write(self.style.NOTICE("Creating Support Tickets & Notifications..."))
        ticket1 = SupportTicket.objects.create(
            ticket_number='TCK-109283',
            user=customer_sipho,
            subject='Inquiry about interest accrual schedule on savings accounts',
            category=TicketCategory.ACCOUNT,
            priority=TicketPriority.MEDIUM,
            status=TicketStatus.IN_PROGRESS,
            assigned_to=staff_user
        )
        SupportMessage.objects.create(
            ticket=ticket1, sender=customer_sipho,
            message='Good day SmartBank team, could you please clarify whether interest is calculated daily and credited monthly?'
        )
        SupportMessage.objects.create(
            ticket=ticket1, sender=staff_user, is_staff_reply=True,
            message='Hello Sipho, thank you for reaching out! In our simulated banking platform, interest calculations are displayed transparently and credited monthly on the first business day.'
        )

        # In-app notifications
        Notification.objects.create(
            user=customer_sipho,
            title='🎉 Microloan Disbursed',
            message='Your equipment microloan of R10,000.00 has been approved and credited to account SB-55667788.',
            notification_type=NotificationType.LOAN,
            action_url='/dashboard/loans',
            is_read=True
        )
        Notification.objects.create(
            user=customer_sipho,
            title='Stokvel Round 3 Contribution Due',
            message='Reminder: Your monthly contribution of R1,000.00 for Soweto Entrepreneurs Stokvel is due this Sunday.',
            notification_type=NotificationType.CIRCLE,
            action_url='/dashboard/circles',
            is_read=False
        )
        Notification.objects.create(
            user=customer_sipho,
            title='Savings Milestone Approaching',
            message='You have achieved 60% of your Emergency Resilience Fund target. Great progress!',
            notification_type=NotificationType.GOAL,
            action_url='/dashboard/savings',
            is_read=False
        )

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("SmartBank seed data created successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Documented Demo Accounts for Local Development:"))
        self.stdout.write(self.style.SUCCESS("1. Customer:      customer@smartbank.local / CustomerPassword123!"))
        self.stdout.write(self.style.SUCCESS("2. Secondary:     lerato@smartbank.local   / CustomerPassword123!"))
        self.stdout.write(self.style.SUCCESS("3. Bank Staff:    staff@smartbank.local    / StaffPassword123!"))
        self.stdout.write(self.style.SUCCESS("4. Administrator: admin@smartbank.local    / AdminPassword123!"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
