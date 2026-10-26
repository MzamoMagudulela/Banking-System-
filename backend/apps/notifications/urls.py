from django.urls import path
from apps.notifications.views import (
    NotificationListView, MarkNotificationReadView, MarkAllNotificationsReadView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('<uuid:pk>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('read-all/', MarkAllNotificationsReadView.as_view(), name='notification-read-all'),
]
