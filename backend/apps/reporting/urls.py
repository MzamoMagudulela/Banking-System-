from django.urls import path
from apps.reporting.views import InstitutionalOverviewView, ExportTransactionsCsvView

urlpatterns = [
    path('overview/', InstitutionalOverviewView.as_view(), name='reporting-overview'),
    path('export/transactions/', ExportTransactionsCsvView.as_view(), name='reporting-export-transactions'),
]
