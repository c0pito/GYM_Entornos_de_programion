"""Serializers for the gym API."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Machine, MembershipPlan, Reservation, UserMembership

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'phone',
            'role',
            'password',
        )
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def to_internal_value(self, data):
        if 'nombre' in data or 'apellido' in data:
            data = data.copy()
            if 'nombre' in data:
                data['first_name'] = data.pop('nombre')
            if 'apellido' in data:
                data['last_name'] = data.pop('apellido')
        return super().to_internal_value(data)

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['nombre'] = instance.first_name
        data['apellido'] = instance.last_name
        data.pop('first_name', None)
        data.pop('last_name', None)
        return data


class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = ('id', 'name', 'price_usd', 'total_days', 'active', 'created_at')
        read_only_fields = ('id', 'created_at')


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'role')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['nombre'] = instance.first_name
        data['apellido'] = instance.last_name
        data.pop('first_name', None)
        data.pop('last_name', None)
        return data


class UserMembershipSerializer(serializers.ModelSerializer):
    plan = MembershipPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        source='plan', queryset=MembershipPlan.objects.filter(active=True), write_only=True
    )
    usuario = SimpleUserSerializer(source='user', read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        source='user', queryset=User.objects.all(), write_only=True, required=False
    )
    days_left = serializers.SerializerMethodField()

    class Meta:
        model = UserMembership
        fields = (
            'id',
            'usuario',
            'usuario_id',
            'plan',
            'plan_id',
            'activated_at',
            'bonus_days',
            'days_left',
            'created_at',
        )
        read_only_fields = ('id', 'created_at', 'usuario', 'plan', 'days_left')

    def get_days_left(self, obj):
        return obj.days_left


class MembershipActivationSerializer(serializers.Serializer):
    plan_id = serializers.PrimaryKeyRelatedField(
        source='plan', queryset=MembershipPlan.objects.filter(active=True)
    )
    bonus_days = serializers.IntegerField(min_value=0, required=False, default=0)

    def validate(self, attrs):
        user = self.context['request'].user
        latest = UserMembership.objects.filter(user=user).order_by('-activated_at').first()
        if latest and latest.days_left > 0:
            raise serializers.ValidationError('Ya tienes una membresía activa.')
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        return UserMembership.objects.create(user=user, **validated_data)


class AdminAssignMembershipSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        source='user', queryset=User.objects.all()
    )
    plan_id = serializers.PrimaryKeyRelatedField(
        source='plan', queryset=MembershipPlan.objects.filter(active=True)
    )
    bonus_days = serializers.IntegerField(min_value=0, required=False, default=0)

    def create(self, validated_data):
        return UserMembership.objects.create(**validated_data)


class GiftDaysSerializer(serializers.Serializer):
    extra_days = serializers.IntegerField(min_value=1)

    def update(self, instance, validated_data):
        instance.bonus_days += validated_data['extra_days']
        instance.save(update_fields=['bonus_days'])
        return instance


class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = ('id', 'name', 'description', 'active', 'created_at')
        read_only_fields = ('id', 'created_at')


class ReservationSerializer(serializers.ModelSerializer):
    machine = MachineSerializer(read_only=True)
    machine_id = serializers.PrimaryKeyRelatedField(
        source='machine', queryset=Machine.objects.filter(active=True), write_only=True
    )
    usuario = SimpleUserSerializer(source='user', read_only=True)

    class Meta:
        model = Reservation
        fields = (
            'id',
            'machine',
            'machine_id',
            'usuario',
            'start_time',
            'end_time',
            'created_at',
        )
        read_only_fields = ('id', 'machine', 'usuario', 'created_at')

    def validate(self, attrs):
        if attrs['end_time'] <= attrs['start_time']:
            raise serializers.ValidationError('La hora final debe ser mayor que la inicial.')
        machine = attrs['machine']
        start_time = attrs['start_time']
        end_time = attrs['end_time']
        qs = Reservation.objects.filter(machine=machine)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(start_time__lt=end_time, end_time__gt=start_time).exists():
            raise serializers.ValidationError('La máquina ya está reservada en ese horario.')
        return attrs


class SlotSerializer(serializers.Serializer):
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    reserved = serializers.BooleanField()
