from django.urls import path
from apps.security.views import SecurityAlertViewSet, SecurityRuleConfigViewSet

urlpatterns = [
    path('alerts/', SecurityAlertViewSet.as_view({'get': 'list'}), name='security-alerts-list'),
    path('alerts/<uuid:pk>/', SecurityAlertViewSet.as_view({'get': 'retrieve'}), name='security-alert-detail'),
    path('alerts/<uuid:pk>/resolve/', SecurityAlertViewSet.as_view({'post': 'resolve'}), name='security-alert-resolve'),

    path('rules/', SecurityRuleConfigViewSet.as_view({'get': 'list'}), name='security-rules-list'),
    path('rules/<int:pk>/', SecurityRuleConfigViewSet.as_view({'patch': 'partial_update'}), name='security-rule-update'),
]
