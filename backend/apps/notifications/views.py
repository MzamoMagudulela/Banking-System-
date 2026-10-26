from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

class NotificationListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = Notification.objects.filter(user=user)[:50]
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        return Response({
            'unread_count': unread_count,
            'results': NotificationSerializer(notifications, many=True).data
        })

class MarkNotificationReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notif = Notification.objects.filter(id=pk, user=request.user).first()
        if not notif:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'message': 'Marked as read.'})

class MarkAllNotificationsReadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})
