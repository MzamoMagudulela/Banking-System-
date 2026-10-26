from decimal import Decimal
from django.utils import timezone
from datetime import date
from rest_framework import serializers
from apps.savings.models import (
    SavingsGoal, SavingsContribution, SavingsCircle,
    SavingsCircleMembership, CircleContribution, CirclePayout,
    GoalStatus, MemberRole, PayoutStatus
)
from apps.banking.serializers import BankAccountSerializer

class SavingsContributionSerializer(serializers.ModelSerializer):
    account_number = serializers.ReadOnlyField(source='account.account_number')

    class Meta:
        model = SavingsContribution
        fields = ['id', 'goal', 'account', 'account_number', 'amount', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    suggested_monthly_contribution = serializers.SerializerMethodField()
    suggested_weekly_contribution = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    contributions = SavingsContributionSerializer(many=True, read_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'user', 'account', 'name', 'category', 'target_amount',
            'current_amount', 'target_date', 'status', 'progress_percentage',
            'remaining_amount', 'days_remaining', 'suggested_monthly_contribution',
            'suggested_weekly_contribution', 'created_at', 'contributions'
        ]
        read_only_fields = ['id', 'user', 'current_amount', 'status', 'created_at']

    def get_days_remaining(self, obj):
        today = timezone.now().date()
        if obj.target_date > today:
            return (obj.target_date - today).days
        return 0

    def get_suggested_monthly_contribution(self, obj):
        remaining = obj.remaining_amount
        if remaining <= Decimal('0.00'):
            return Decimal('0.00')
        days = self.get_days_remaining(obj)
        months = max(Decimal('1.0'), Decimal(str(round(days / 30.4, 1))))
        return round(remaining / months, 2)

    def get_suggested_weekly_contribution(self, obj):
        remaining = obj.remaining_amount
        if remaining <= Decimal('0.00'):
            return Decimal('0.00')
        days = self.get_days_remaining(obj)
        weeks = max(Decimal('1.0'), Decimal(str(round(days / 7.0, 1))))
        return round(remaining / weeks, 2)


class FundGoalSerializer(serializers.Serializer):
    source_account_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1.00)
    notes = serializers.CharField(max_length=200, required=False, allow_blank=True)


class CircleMembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = SavingsCircleMembership
        fields = ['id', 'user', 'user_name', 'user_email', 'role', 'joined_at', 'is_active']
        read_only_fields = ['id', 'joined_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class CircleContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()

    class Meta:
        model = CircleContribution
        fields = ['id', 'circle', 'member', 'member_name', 'amount', 'round_number', 'notes', 'timestamp']
        read_only_fields = ['id', 'timestamp']

    def get_member_name(self, obj):
        return obj.member.get_full_name() or obj.member.email


class CirclePayoutSerializer(serializers.ModelSerializer):
    recipient_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CirclePayout
        fields = [
            'id', 'circle', 'recipient', 'recipient_name', 'amount', 'round_number',
            'status', 'notes', 'approved_by', 'approved_by_name', 'proposed_at',
            'approved_at', 'disbursed_at'
        ]
        read_only_fields = ['id', 'status', 'approved_by', 'proposed_at', 'approved_at', 'disbursed_at']

    def get_recipient_name(self, obj):
        return obj.recipient.get_full_name() or obj.recipient.email

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.email
        return None


class SavingsCircleSerializer(serializers.ModelSerializer):
    creator_name = serializers.SerializerMethodField()
    members = CircleMembershipSerializer(source='memberships', many=True, read_only=True)
    total_saved = serializers.SerializerMethodField()
    recent_contributions = serializers.SerializerMethodField()
    payouts = CirclePayoutSerializer(many=True, read_only=True)

    class Meta:
        model = SavingsCircle
        fields = [
            'id', 'name', 'description', 'creator', 'creator_name', 'target_amount',
            'contribution_amount', 'frequency', 'current_round', 'status',
            'meeting_day', 'payout_rule_description', 'created_at',
            'total_saved', 'members', 'recent_contributions', 'payouts'
        ]
        read_only_fields = ['id', 'creator', 'current_round', 'status', 'created_at']

    def get_creator_name(self, obj):
        return obj.creator.get_full_name() or obj.creator.email

    def get_total_saved(self, obj):
        return obj.total_collected()

    def get_recent_contributions(self, obj):
        return CircleContributionSerializer(obj.contributions.all()[:10], many=True).data
