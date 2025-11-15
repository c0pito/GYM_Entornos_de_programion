"""Database models for the gym backend running on MongoDB."""

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from datetime import timedelta
from math import ceil

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager that uses the email as the username field."""

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMINISTRADOR)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True')

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """User model with roles for the gym application."""

    class Role(models.TextChoices):
        ADMINISTRADOR = 'Administrador', 'Administrador'
        ENTRENADOR = 'Entrenador', 'Entrenador'
        CLIENTE = 'Cliente', 'Cliente'

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENTE)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def nombre(self):
        return self.first_name

    @property
    def apellido(self):
        return self.last_name


class MembershipPlan(models.Model):
    """Membership plan that can be activated by the users."""

    name = models.CharField(max_length=150, unique=True)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_days = models.PositiveIntegerField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class UserMembership(models.Model):
    """Activation of a plan by a concrete user."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    plan = models.ForeignKey(MembershipPlan, on_delete=models.PROTECT, related_name='activations')
    activated_at = models.DateTimeField(default=timezone.now)
    bonus_days = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-activated_at',)

    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"

    @property
    def expires_at(self):
        total_days = self.plan.total_days + self.bonus_days
        return self.activated_at + timedelta(days=total_days)

    @property
    def days_left(self):
        remaining = self.expires_at - timezone.now()
        total_seconds = remaining.total_seconds()
        return max(0, int(ceil(total_seconds / 86400)))

    def has_expired(self):
        return self.days_left <= 0


class Machine(models.Model):
    """Gym machine that can be reserved by clients."""

    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class Reservation(models.Model):
    """Reservation of a machine within a time slot."""

    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='reservations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('start_time',)
        constraints = [
            models.UniqueConstraint(fields=('machine', 'start_time'), name='machine_unique_slot_start'),
        ]

    def __str__(self):
        return f"{self.machine.name} - {self.start_time:%Y-%m-%d %H:%M}"

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError('La hora final debe ser mayor que la hora inicial.')

        overlapping = (
            Reservation.objects.filter(machine=self.machine)
            .exclude(pk=self.pk)
            .filter(start_time__lt=self.end_time, end_time__gt=self.start_time)
        )
        if overlapping.exists():
            raise ValidationError('La máquina ya está reservada en ese horario.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
