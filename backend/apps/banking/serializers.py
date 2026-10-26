from decimal import Decimal
from rest_framework import serializers
from apps.banking.models import BankAccount, Transaction, TransactionEntry, AccountType, AccountStatus

class TransactionEntrySerializer(serializers.ModelSerializer):
    account_number = serializers.ReadOnlyField(source='account.account_number')

    class Meta:
        model = TransactionEntry
        fields = ['id', 'account_number', 'entry_type', 'amount', 'balance_after', 'timestamp']

class TransactionSerializer(serializers.ModelSerializer):
    source_account_number = serializers.ReadOnlyField(source='source_account.account_number')
    destination_account_number = serializers.ReadOnlyField(source='destination_account.account_number')
    initiator_email = serializers.ReadOnlyField(source='initiating_user.email')
    ledger_entries = TransactionEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'transaction_type', 'source_account', 'source_account_number',
            'destination_account', 'destination_account_number', 'amount', 'currency',
            'status', 'description', 'initiator_email', 'idempotency_key',
            'failure_reason', 'created_at', 'completed_at', 'ledger_entries'
        ]
        read_only_fields = ['id', 'reference', 'status', 'failure_reason', 'created_at', 'completed_at']

class BankAccountSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.ReadOnlyField(source='user.email')
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_number', 'user', 'owner_name', 'owner_email',
            'account_type', 'status', 'currency', 'available_balance',
            'ledger_balance', 'daily_transfer_limit', 'created_at', 'recent_transactions'
        ]
        read_only_fields = ['id', 'account_number', 'available_balance', 'ledger_balance', 'created_at']

    def get_owner_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_recent_transactions(self, obj):
        txs = Transaction.objects.filter(
            source_account=obj
        ) | Transaction.objects.filter(
            destination_account=obj
        )
        return TransactionSerializer(txs.order_by('-created_at')[:5], many=True).data

class TransferRequestSerializer(serializers.Serializer):
    source_account_id = serializers.UUIDField()
    destination_account_number = serializers.CharField(max_length=30)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    description = serializers.CharField(max_length=200, required=False, allow_blank=True)
    idempotency_key = serializers.CharField(max_length=128, required=False, allow_blank=True)

class DepositWithdrawRequestSerializer(serializers.Serializer):
    account_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    description = serializers.CharField(max_length=200, required=False, allow_blank=True)
    idempotency_key = serializers.CharField(max_length=128, required=False, allow_blank=True)

class OpenAccountSerializer(serializers.Serializer):
    account_type = serializers.ChoiceField(choices=AccountType.choices, default=AccountType.SAVINGS)
    initial_deposit = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), min_value=Decimal('0.00'))

