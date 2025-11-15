"""URL configuration for the gym application."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ClientMembershipViewSet,
    HealthView,
    LoginView,
    MeView,
    MembershipViewSet,
    PaymentViewSet,
    RefreshTokenView,
    RegisterView,
    UserViewSet,
)

router = DefaultRouter()
router.register('usuario', UserViewSet, basename='usuario')
router.register('membresia', MembershipViewSet, basename='membresia')
router.register('clientemembresia', ClientMembershipViewSet, basename='clientemembresia')
router.register('gimnasio', PaymentViewSet, basename='pagos')

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh', RefreshTokenView.as_view(), name='token_refresh'),
    path('auth/register', RegisterView.as_view(), name='auth_register'),
    path('auth/me', MeView.as_view(), name='auth_me'),
    path('health', HealthView.as_view(), name='health'),
    path('', include(router.urls)),
    path('usuario/list', UserViewSet.as_view({'get': 'list'}), name='usuario-list-alias'),
    path('usuario/', UserViewSet.as_view({'post': 'create'}), name='usuario-create-alias'),
    path('usuario/<pk>', UserViewSet.as_view({'delete': 'destroy'}), name='usuario-delete-alias'),
    path('membresia/list', MembershipViewSet.as_view({'get': 'list'}), name='membresia-list-alias'),
    path('membresia/', MembershipViewSet.as_view({'post': 'create'}), name='membresia-create-alias'),
    path('membresia/<pk>', MembershipViewSet.as_view({'delete': 'destroy'}), name='membresia-delete-alias'),
    path('clientemembresia/list', ClientMembershipViewSet.as_view({'get': 'list'}), name='clientemembresia-list-alias'),
    path('clientemembresia/', ClientMembershipViewSet.as_view({'post': 'create'}), name='clientemembresia-create-alias'),
    path('clientemembresia/<pk>', ClientMembershipViewSet.as_view({'delete': 'destroy'}), name='clientemembresia-delete-alias'),
    path('gimnasio/pagos', PaymentViewSet.as_view({'get': 'list'}), name='pagos-list-alias'),
    path('gimnasio/pago', PaymentViewSet.as_view({'post': 'create'}), name='pago-create-alias'),
    path('gimnasio/pago/<pk>', PaymentViewSet.as_view({'delete': 'destroy'}), name='pago-delete-alias'),
]
