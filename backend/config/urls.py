from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI 3 Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # SmartBank Core v1 API
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/banking/', include('apps.banking.urls')),
    path('api/v1/savings/', include('apps.savings.urls')),
    path('api/v1/loans/', include('apps.loans.urls')),
    path('api/v1/security/', include('apps.security.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/support/', include('apps.support.urls')),
    path('api/v1/reporting/', include('apps.reporting.urls')),
]
