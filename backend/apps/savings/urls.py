from django.urls import path
from apps.savings.views import SavingsGoalViewSet, SavingsCircleViewSet

urlpatterns = [
    # Goals
    path('goals/', SavingsGoalViewSet.as_view({'get': 'list', 'post': 'create'}), name='savings-goals-list'),
    path('goals/<uuid:pk>/', SavingsGoalViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='savings-goal-detail'),
    path('goals/<uuid:pk>/fund/', SavingsGoalViewSet.as_view({'post': 'fund'}), name='savings-goal-fund'),

    # Circles
    path('circles/', SavingsCircleViewSet.as_view({'get': 'list', 'post': 'create'}), name='savings-circles-list'),
    path('circles/<uuid:pk>/', SavingsCircleViewSet.as_view({'get': 'retrieve'}), name='savings-circle-detail'),
    path('circles/<uuid:pk>/join/', SavingsCircleViewSet.as_view({'post': 'join'}), name='savings-circle-join'),
    path('circles/<uuid:pk>/contribute/', SavingsCircleViewSet.as_view({'post': 'contribute'}), name='savings-circle-contribute'),
    path('circles/<uuid:pk>/propose-payout/', SavingsCircleViewSet.as_view({'post': 'propose_payout'}), name='savings-circle-propose-payout'),
    path('circles/<uuid:pk>/payouts/<uuid:payout_id>/approve/', SavingsCircleViewSet.as_view({'post': 'approve_payout'}), name='savings-circle-approve-payout'),
]
