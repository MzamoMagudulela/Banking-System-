from django.urls import path
from apps.loans.views import LoanCalculateView, LoanApplicationViewSet

urlpatterns = [
    path('calculate/', LoanCalculateView.as_view(), name='loan-calculate'),
    path('applications/', LoanApplicationViewSet.as_view({'get': 'list', 'post': 'create'}), name='loan-applications-list'),
    path('applications/<uuid:pk>/', LoanApplicationViewSet.as_view({'get': 'retrieve'}), name='loan-application-detail'),
    path('applications/<uuid:pk>/decision/', LoanApplicationViewSet.as_view({'post': 'decision'}), name='loan-application-decision'),
    path('applications/<uuid:pk>/request-info/', LoanApplicationViewSet.as_view({'post': 'request_info'}), name='loan-application-request-info'),
    path('applications/<uuid:pk>/repay/', LoanApplicationViewSet.as_view({'post': 'repay'}), name='loan-application-repay'),
]
