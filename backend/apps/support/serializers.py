import secrets
from rest_framework import serializers
from apps.support.models import SupportTicket, SupportMessage, TicketCategory, TicketPriority, TicketStatus

class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.ReadOnlyField(source='sender.email')

    class Meta:
        model = SupportMessage
        fields = ['id', 'sender_email', 'sender_name', 'message', 'is_staff_reply', 'created_at']
        read_only_fields = ['id', 'sender_email', 'is_staff_reply', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email

class SupportTicketSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.SerializerMethodField()
    assigned_to_email = serializers.ReadOnlyField(source='assigned_to.email')
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'user', 'user_email', 'user_name',
            'subject', 'category', 'priority', 'status', 'assigned_to_email',
            'resolution_notes', 'created_at', 'updated_at', 'messages'
        ]
        read_only_fields = ['id', 'ticket_number', 'user', 'assigned_to_email', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

class CreateTicketSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=200)
    category = serializers.ChoiceField(choices=TicketCategory.choices, default=TicketCategory.GENERAL)
    priority = serializers.ChoiceField(choices=TicketPriority.choices, default=TicketPriority.MEDIUM)
    initial_message = serializers.CharField(max_length=2000)
