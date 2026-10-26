import secrets
from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.support.models import SupportTicket, SupportMessage, TicketStatus
from apps.support.serializers import (
    SupportTicketSerializer, SupportMessageSerializer, CreateTicketSerializer
)
from apps.accounts.permissions import IsStaffUser
from apps.accounts.views import record_audit
from apps.notifications.models import Notification, NotificationType

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SupportTicket.objects.select_related('user', 'assigned_to').prefetch_related('messages')
        if not user.is_bank_staff():
            qs = qs.filter(user=user)

        cat = self.request.query_params.get('category')
        st = self.request.query_params.get('status')
        prio = self.request.query_params.get('priority')
        if cat:
            qs = qs.filter(category=cat)
        if st:
            qs = qs.filter(status=st)
        if prio:
            qs = qs.filter(priority=prio)

        return qs.order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        serializer = CreateTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ticket_num = f"TCK-{secrets.randbelow(900000) + 100000}"
        ticket = SupportTicket.objects.create(
            ticket_number=ticket_num,
            user=request.user,
            subject=data['subject'],
            category=data['category'],
            priority=data['priority'],
            status=TicketStatus.OPEN
        )

        SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=data['initial_message'],
            is_staff_reply=request.user.is_bank_staff()
        )

        record_audit(request, 'CREATE_SUPPORT_TICKET', 'SupportTicket', ticket.id)
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def message(self, request, pk=None):
        ticket = self.get_object()
        msg_text = request.data.get('message', '').strip()
        if not msg_text:
            return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        is_staff = request.user.is_bank_staff()
        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=msg_text,
            is_staff_reply=is_staff
        )

        # Update status
        if is_staff:
            ticket.status = TicketStatus.WAITING_CUSTOMER
            ticket.assigned_to = request.user
            Notification.objects.create(
                user=ticket.user,
                title="Support Response Received",
                message=f"Staff replied to your ticket '{ticket.subject}'.",
                notification_type=NotificationType.SUPPORT,
                action_url=f"/dashboard/support/{ticket.id}"
            )
        else:
            ticket.status = TicketStatus.IN_PROGRESS

        ticket.save(update_fields=['status', 'assigned_to', 'updated_at'])
        return Response(SupportMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], permission_classes=[IsStaffUser])
    def status_update(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        res_notes = request.data.get('resolution_notes', '')

        if new_status:
            ticket.status = new_status
            if new_status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
                ticket.resolved_at = timezone.now()
                ticket.resolution_notes = res_notes

        ticket.save()
        record_audit(request, f'SUPPORT_STATUS_{ticket.status}', 'SupportTicket', ticket.id)
        return Response(SupportTicketSerializer(ticket).data)
