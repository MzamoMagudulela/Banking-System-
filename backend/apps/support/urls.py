from django.urls import path
from apps.support.views import SupportTicketViewSet

urlpatterns = [
    path('tickets/', SupportTicketViewSet.as_view({'get': 'list', 'post': 'create'}), name='support-tickets-list'),
    path('tickets/<uuid:pk>/', SupportTicketViewSet.as_view({'get': 'retrieve'}), name='support-ticket-detail'),
    path('tickets/<uuid:pk>/message/', SupportTicketViewSet.as_view({'post': 'message'}), name='support-ticket-message'),
    path('tickets/<uuid:pk>/status/', SupportTicketViewSet.as_view({'patch': 'status_update'}), name='support-ticket-status-update'),
]
