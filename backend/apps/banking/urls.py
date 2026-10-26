from django.urls import path
from apps.banking.views import (
    BankAccountViewSet, TransactionViewSet, TransferView,
    DepositView, WithdrawView, ReverseTransactionView, ReportTransactionView
)

urlpatterns = [
    path('accounts/', BankAccountViewSet.as_view({'get': 'list', 'post': 'create'}), name='account-list-create'),
    path('accounts/<uuid:pk>/', BankAccountViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='account-detail'),
    path('accounts/<uuid:pk>/status/', BankAccountViewSet.as_view({'patch': 'set_status'}), name='account-set-status'),

    path('transactions/', TransactionViewSet.as_view({'get': 'list'}), name='transaction-list'),
    path('transactions/<uuid:pk>/', TransactionViewSet.as_view({'get': 'retrieve'}), name='transaction-detail'),
    path('transactions/transfer/', TransferView.as_view(), name='transaction-transfer'),
    path('transactions/deposit/', DepositView.as_view(), name='transaction-deposit'),
    path('transactions/withdraw/', WithdrawView.as_view(), name='transaction-withdraw'),
    path('transactions/<uuid:pk>/reverse/', ReverseTransactionView.as_view(), name='transaction-reverse'),
    path('transactions/<uuid:pk>/report/', ReportTransactionView.as_view(), name='transaction-report'),
]
