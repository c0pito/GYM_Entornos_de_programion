"""Views for the gym API."""

from django.contrib.auth import authenticate, get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import ClientMembership, Membership, Payment
from .permissions import IsAdminRole
from .serializers import (
    ClientMembershipSerializer,
    MembershipSerializer,
    PaymentSerializer,
    UserSerializer,
)

User = get_user_model()


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})


class GymTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['nombre'] = user.first_name
        token['apellido'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        serializer = UserSerializer(self.user)
        data['jwt'] = data.pop('access')
        data['usuario'] = serializer.data
        data['refresh'] = data.get('refresh')
        return data


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = GymTokenObtainPairSerializer


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data.copy()
        payload['role'] = User.Role.CLIENTE
        serializer = UserSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        if 'password' not in serializer.validated_data:
            return Response(
                {'password': ['Este campo es obligatorio.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {
                'usuario': user_data,
                'jwt': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('first_name')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in {'create', 'destroy', 'list'}:
            permission_classes = [IsAdminRole]
        elif self.action in {'perfil', 'update_perfil'}:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='perfil')
    def perfil(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'], url_path='perfil')
    def update_perfil(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.all().order_by('name')
    serializer_class = MembershipSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve'}:
            return [AllowAny()]
        return [IsAdminRole()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClientMembershipViewSet(viewsets.ModelViewSet):
    queryset = ClientMembership.objects.select_related('user', 'membership').all()
    serializer_class = ClientMembershipSerializer

    def get_permissions(self):
        if self.action in {'list', 'create', 'destroy'}:
            permission_classes = [IsAdminRole]
        elif self.action == 'mis_membresias':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='mis-membresias')
    def mis_membresias(self, request):
        queryset = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('client_membership__user', 'client_membership__membership').all()
    serializer_class = PaymentSerializer

    def get_permissions(self):
        if self.action in {'list', 'create', 'destroy'}:
            permission_classes = [IsAdminRole]
        elif self.action == 'mis_pagos':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='mis-pagos')
    def mis_pagos(self, request):
        queryset = self.get_queryset().filter(client_membership__user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
