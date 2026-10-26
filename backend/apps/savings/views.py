from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.savings.models import (
    SavingsGoal, SavingsContribution, SavingsCircle,
    SavingsCircleMembership, CircleContribution, CirclePayout,
    GoalStatus, MemberRole, PayoutStatus, CircleStatus
)
from apps.savings.serializers import (
    SavingsGoalSerializer, SavingsContributionSerializer, FundGoalSerializer,
    SavingsCircleSerializer, CircleMembershipSerializer, CirclePayoutSerializer
)
from apps.banking.models import BankAccount, AccountStatus
from apps.banking.services import TransactionService
from apps.banking.exceptions import InsufficientFundsError, IneligibleAccountError
from apps.notifications.models import Notification, NotificationType
from apps.accounts.views import record_audit

class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_bank_staff():
            return SavingsGoal.objects.select_related('user', 'account').prefetch_related('contributions').all()
        return SavingsGoal.objects.filter(user=user).select_related('account').prefetch_related('contributions')

    def perform_create(self, serializer):
        goal = serializer.save(user=self.request.user)
        record_audit(self.request, 'CREATE_SAVINGS_GOAL', 'SavingsGoal', goal.id, {'name': goal.name, 'target': str(goal.target_amount)})
        Notification.objects.create(
            user=self.request.user,
            title="New Savings Goal Started",
            message=f"You started tracking towards '{goal.name}' (Target: R{goal.target_amount:,.2f}). Keep going!",
            notification_type=NotificationType.GOAL,
            action_url=f"/dashboard/savings/{goal.id}"
        )

    @action(detail=True, methods=['post'])
    def fund(self, request, pk=None):
        goal = self.get_object()
        serializer = FundGoalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        source_account = BankAccount.objects.filter(id=data['source_account_id']).first()
        if not source_account or source_account.user != request.user:
            return Response({'error': 'Invalid funding account.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = data['amount']
        with transaction.atomic():
            # Withdraw from account
            try:
                txn = TransactionService.execute_withdrawal(
                    account=source_account,
                    amount=amount,
                    description=f"Goal Contribution: {goal.name}",
                    initiating_user=request.user
                )
            except InsufficientFundsError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except IneligibleAccountError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            contribution = SavingsContribution.objects.create(
                goal=goal,
                account=source_account,
                amount=amount,
                notes=data.get('notes', ''),
                transaction=txn
            )

            goal.current_amount += amount
            if goal.current_amount >= goal.target_amount and goal.status != GoalStatus.COMPLETED:
                goal.status = GoalStatus.COMPLETED
                Notification.objects.create(
                    user=request.user,
                    title="🎉 Goal Reached!",
                    message=f"Congratulations! You reached your savings target for '{goal.name}' (R{goal.target_amount:,.2f})!",
                    notification_type=NotificationType.GOAL,
                    action_url=f"/dashboard/savings/{goal.id}"
                )
            goal.save(update_fields=['current_amount', 'status', 'updated_at'])

        record_audit(request, 'FUND_SAVINGS_GOAL', 'SavingsGoal', goal.id, {'amount': str(amount)})
        return Response(SavingsGoalSerializer(goal).data)


class SavingsCircleViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsCircleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_bank_staff():
            return SavingsCircle.objects.prefetch_related('memberships', 'contributions', 'payouts').all()
        # Return all circles so users can explore and join them
        return SavingsCircle.objects.prefetch_related('memberships', 'contributions', 'payouts').all()

    def perform_create(self, serializer):
        circle = serializer.save(creator=self.request.user)
        # Automatically make creator the LEADER
        SavingsCircleMembership.objects.create(
            circle=circle,
            user=self.request.user,
            role=MemberRole.LEADER,
            is_active=True
        )
        record_audit(self.request, 'CREATE_SAVINGS_CIRCLE', 'SavingsCircle', circle.id, {'name': circle.name})

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        circle = self.get_object()
        membership, created = SavingsCircleMembership.objects.get_or_create(
            circle=circle,
            user=request.user,
            defaults={'role': MemberRole.MEMBER, 'is_active': True}
        )
        if not created and not membership.is_active:
            membership.is_active = True
            membership.save(update_fields=['is_active'])

        record_audit(request, 'JOIN_SAVINGS_CIRCLE', 'SavingsCircle', circle.id)
        return Response({'message': f'You joined {circle.name}!', 'circle': SavingsCircleSerializer(circle).data})

    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        circle = self.get_object()
        user = request.user
        membership = circle.memberships.filter(user=user, is_active=True).first()
        if not membership and not user.is_bank_staff():
            return Response({'error': 'You must be a member of this circle to contribute.'}, status=status.HTTP_403_FORBIDDEN)

        account_id = request.data.get('account_id')
        amount = Decimal(str(request.data.get('amount', circle.contribution_amount)))
        notes = request.data.get('notes', '')

        source_acc = BankAccount.objects.filter(id=account_id, user=user).first()
        if not source_acc:
            return Response({'error': 'Please provide an active funding account belonging to you.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                txn = TransactionService.execute_withdrawal(
                    account=source_acc,
                    amount=amount,
                    description=f"Savings Circle Contribution: {circle.name}",
                    initiating_user=user
                )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            contribution = CircleContribution.objects.create(
                circle=circle,
                member=user,
                amount=amount,
                round_number=circle.current_round,
                notes=notes,
                transaction=txn
            )

        record_audit(request, 'CIRCLE_CONTRIBUTION', 'SavingsCircle', circle.id, {'amount': str(amount)})
        return Response({
            'message': f"Contribution of R{amount:,.2f} recorded.",
            'circle': SavingsCircleSerializer(circle).data
        })

    @action(detail=True, methods=['post'])
    def propose_payout(self, request, pk=None):
        circle = self.get_object()
        recipient_id = request.data.get('recipient_id')
        amount = Decimal(str(request.data.get('amount', circle.contribution_amount * circle.memberships.count())))
        notes = request.data.get('notes', '')

        recipient_membership = circle.memberships.filter(user_id=recipient_id, is_active=True).first()
        if not recipient_membership:
            return Response({'error': 'Recipient must be an active member of this circle.'}, status=status.HTTP_400_BAD_REQUEST)

        payout = CirclePayout.objects.create(
            circle=circle,
            recipient=recipient_membership.user,
            amount=amount,
            round_number=circle.current_round,
            status=PayoutStatus.PROPOSED,
            notes=notes
        )

        record_audit(request, 'PROPOSE_CIRCLE_PAYOUT', 'CirclePayout', payout.id, {'amount': str(amount), 'recipient': recipient_membership.user.email})
        return Response(CirclePayoutSerializer(payout).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='payouts/(?P<payout_id>[^/.]+)/approve')
    def approve_payout(self, request, pk=None, payout_id=None):
        circle = self.get_object()
        payout = circle.payouts.filter(id=payout_id).first()
        if not payout:
            return Response({'error': 'Payout request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payout.status != PayoutStatus.PROPOSED:
            return Response({'error': f'Payout is already {payout.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        # Authorization check: only LEADER or TREASURER or bank staff can approve
        user_membership = circle.memberships.filter(user=user, is_active=True).first()
        is_leader_or_treasurer = user_membership and user_membership.role in [MemberRole.LEADER, MemberRole.TREASURER]
        if not is_leader_or_treasurer and not user.is_bank_staff():
            return Response({'error': 'Only circle leaders or treasurers may approve payouts.'}, status=status.HTTP_403_FORBIDDEN)

        # Rule: cannot approve their own payout
        if payout.recipient == user and not user.is_bank_staff():
            return Response({'error': 'You cannot approve your own payout. Another leader or treasurer must approve.'}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            payout.status = PayoutStatus.APPROVED
            payout.approved_by = user
            payout.approved_at = timezone.now()

            # Disburse to recipient's primary account
            recipient_acc = BankAccount.objects.filter(user=payout.recipient, status=AccountStatus.ACTIVE).first()
            if recipient_acc:
                dep_txn = TransactionService.execute_deposit(
                    account=recipient_acc,
                    amount=payout.amount,
                    description=f"Savings Circle Payout: {circle.name} (Round {circle.current_round})",
                    initiating_user=user
                )
                payout.transaction = dep_txn
                payout.status = PayoutStatus.DISBURSED
                payout.disbursed_at = timezone.now()

            # Advance circle round
            circle.current_round += 1
            circle.save(update_fields=['current_round'])
            payout.save()

            Notification.objects.create(
                user=payout.recipient,
                title="🎁 Circle Payout Disbursed!",
                message=f"Your rotating payout of R{payout.amount:,.2f} from '{circle.name}' has been deposited to your account!",
                notification_type=NotificationType.CIRCLE,
                action_url=f"/dashboard/circles/{circle.id}"
            )

        record_audit(request, 'APPROVE_CIRCLE_PAYOUT', 'CirclePayout', payout.id, {'disbursed_to': payout.recipient.email})
        return Response(CirclePayoutSerializer(payout).data)
