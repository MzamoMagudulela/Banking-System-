from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.security.models import SecurityAlert, SecurityRuleConfig, AlertStatus
from apps.security.serializers import SecurityAlertSerializer, SecurityRuleConfigSerializer
from apps.accounts.permissions import IsStaffUser, IsAdminUser
from apps.accounts.views import record_audit

class SecurityAlertViewSet(viewsets.ModelViewSet):
    serializer_class = SecurityAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SecurityAlert.objects.select_related('user', 'account', 'transaction', 'reviewed_by')
        if not user.is_bank_staff():
            qs = qs.filter(user=user)

        sev = self.request.query_params.get('severity')
        st = self.request.query_params.get('status')
        if sev:
            qs = qs.filter(severity=sev)
        if st:
            qs = qs.filter(status=st)
        return qs.order_by('-created_at')

    @action(detail=True, methods=['post'], permission_classes=[IsStaffUser])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        if new_status not in [AlertStatus.RESOLVED, AlertStatus.DISMISSED, AlertStatus.INVESTIGATING]:
            return Response({'error': 'Invalid status. Must be INVESTIGATING, RESOLVED, or DISMISSED.'}, status=status.HTTP_400_BAD_REQUEST)

        alert.status = new_status
        alert.staff_resolution_notes = notes
        alert.reviewed_by = request.user
        if new_status in [AlertStatus.RESOLVED, AlertStatus.DISMISSED]:
            alert.resolved_at = timezone.now()
        alert.save()

        record_audit(request, f'SECURITY_ALERT_{new_status}', 'SecurityAlert', alert.id, {'notes': notes})
        return Response(SecurityAlertSerializer(alert).data)


class SecurityRuleConfigViewSet(viewsets.ModelViewSet):
    serializer_class = SecurityRuleConfigSerializer
    permission_classes = [IsAdminUser]
    queryset = SecurityRuleConfig.objects.all()
