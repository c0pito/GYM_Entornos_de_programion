"""Views for the gym API."""

from datetime import datetime, time

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Machine, MembershipPlan, Reservation, UserMembership
from .permissions import IsAdminRole
from .serializers import (
    AdminAssignMembershipSerializer,
    GiftDaysSerializer,
    MachineSerializer,
    MembershipActivationSerializer,
    MembershipPlanSerializer,
    ReservationSerializer,
    SlotSerializer,
    UserMembershipSerializer,
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


class MembershipPlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        plans = MembershipPlan.objects.filter(active=True).order_by('name')
        serializer = MembershipPlanSerializer(plans, many=True)
        return Response(serializer.data)


class MembershipActivationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MembershipActivationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        data = UserMembershipSerializer(membership).data
        return Response(data, status=status.HTTP_201_CREATED)


class MyMembershipsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = UserMembership.objects.filter(user=request.user).select_related('plan').order_by('-activated_at')
        serializer = UserMembershipSerializer(memberships, many=True)
        return Response(serializer.data)


class AdminAssignMembershipView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = AdminAssignMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        data = UserMembershipSerializer(membership).data
        return Response(data, status=status.HTTP_201_CREATED)


class GiftDaysView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, membership_id):
        try:
            membership = UserMembership.objects.get(pk=membership_id)
        except UserMembership.DoesNotExist:
            return Response({'detail': 'Membresía no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = GiftDaysSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = serializer.update(membership, serializer.validated_data)
        return Response(UserMembershipSerializer(updated).data)


class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all().order_by('name')
    serializer_class = MachineSerializer

    def get_permissions(self):
        if self.action in {'list', 'retrieve', 'slots'}:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminRole]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['get'], url_path='slots')
    def slots(self, request, pk=None):
        machine = self.get_object()
        date_param = request.query_params.get('date')
        target_date = timezone.localdate()
        if date_param:
            try:
                target_date = datetime.fromisoformat(date_param).date()
            except ValueError:
                return Response({'detail': 'Fecha inválida. Utiliza el formato YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        current_tz = timezone.get_current_timezone()
        start_of_day = timezone.make_aware(datetime.combine(target_date, time.min), current_tz)
        end_of_day = timezone.make_aware(datetime.combine(target_date, time.max), current_tz)
        reservations = machine.reservations.filter(start_time__gte=start_of_day, start_time__lte=end_of_day).order_by('start_time')
        slots = [{'start_time': r.start_time, 'end_time': r.end_time, 'reserved': True} for r in reservations]
        slot_serializer = SlotSerializer(slots, many=True)
        reservation_serializer = ReservationSerializer(reservations, many=True)
        return Response(
            {
                'machine': MachineSerializer(machine).data,
                'reserved_slots': slot_serializer.data,
                'reservations': reservation_serializer.data,
            }
        )


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    queryset = Reservation.objects.select_related('machine', 'user').all()

    def get_permissions(self):
        if self.action in {'agenda'}:
            permission_classes = [IsAuthenticated, IsAdminRole]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
        if user.role == User.Role.ADMINISTRADOR:
            return qs
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='agenda')
    def agenda(self, request):
        machine_id = request.query_params.get('machine')
        qs = Reservation.objects.select_related('machine', 'user').all()
        if machine_id:
            qs = qs.filter(machine_id=machine_id)
        serializer = self.get_serializer(qs.order_by('start_time'), many=True)
        return Response(serializer.data)
