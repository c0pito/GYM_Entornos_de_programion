"""URL configuration for the gym application."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminAssignMembershipView,
    GiftDaysView,
    HealthView,
    LoginView,
    MachineViewSet,
    MembershipActivationView,
    MembershipPlanListView,
    MyMembershipsView,
    RefreshTokenView,
    ReservationViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register('usuario', UserViewSet, basename='usuario')
router.register('machines', MachineViewSet, basename='machine')
router.register('reservations', ReservationViewSet, basename='reservation')

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh', RefreshTokenView.as_view(), name='token_refresh'),
    path('health', HealthView.as_view(), name='health'),
    path('plans/', MembershipPlanListView.as_view(), name='plans-list'),
    path('memberships/activate', MembershipActivationView.as_view(), name='membership-activate'),
    path('memberships/my', MyMembershipsView.as_view(), name='my-memberships'),
    path('admin/memberships/assign', AdminAssignMembershipView.as_view(), name='admin-membership-assign'),
    path('admin/memberships/<int:membership_id>/gift-days', GiftDaysView.as_view(), name='admin-gift-days'),
    path('', include(router.urls)),
]
