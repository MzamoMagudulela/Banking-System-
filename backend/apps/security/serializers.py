from rest_framework import serializers
from apps.security.models import SecurityAlert, SecurityRuleConfig

class SecurityAlertSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    account_number = serializers.ReadOnlyField(source='account.account_number')
    transaction_reference = serializers.ReadOnlyField(source='transaction.reference')
    reviewed_by_email = serializers.ReadOnlyField(source='reviewed_by.email')

    class Meta:
        model = SecurityAlert
        fields = [
            'id', 'user', 'user_email', 'account', 'account_number',
            'transaction', 'transaction_reference', 'rule_name', 'severity',
            'status', 'description', 'evidence_details', 'staff_resolution_notes',
            'reviewed_by_email', 'is_customer_reported', 'created_at', 'resolved_at'
        ]
        read_only_fields = [
            'id', 'user', 'rule_name', 'severity', 'description',
            'evidence_details', 'is_customer_reported', 'created_at', 'resolved_at'
        ]

class SecurityRuleConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityRuleConfig
        fields = ['id', 'rule_key', 'name', 'description', 'threshold_value', 'is_enabled', 'severity', 'updated_at']
