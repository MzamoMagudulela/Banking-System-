from django.urls import path
from apps.accounts.views import (
    RegisterView, LoginView, LogoutView, CurrentUserView,
    PasswordResetSimulatedView, CustomerManagementViewSet,
    VerifyCustomerView, StaffManagementView, AuditLogListView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('password-reset/', PasswordResetSimulatedView.as_view(), name='auth-password-reset'),

    # Staff customer operations
    path('customers/', CustomerManagementViewSet.as_view({'get': 'list'}), name='staff-customers-list'),
    path('customers/<uuid:pk>/', CustomerManagementViewSet.as_view({'get': 'retrieve'}), name='staff-customer-detail'),
    path('customers/<uuid:pk>/verify/', VerifyCustomerView.as_view(), name='staff-customer-verify'),

    # Admin staff management
    path('staff/', StaffManagementView.as_view(), name='admin-staff-management'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs-list'),
]
