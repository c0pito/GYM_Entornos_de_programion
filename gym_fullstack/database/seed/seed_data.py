"""Script de datos iniciales para el proyecto del gimnasio."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import models as django_models

from gym.models import ClientMembership, Membership, Payment


User = get_user_model()


def get_model_or_none(model_name):
    try:
        return apps.get_model('gym', model_name)
    except (LookupError, ValueError):
        return None


MembershipPlan = get_model_or_none('MembershipPlan') or Membership
Machine = get_model_or_none('Machine')
Reservation = get_model_or_none('Reservation')


ADMIN_EMAIL = "admin@gym.com"
COACH_EMAIL = "coach@gym.com"
CLIENT_EMAIL = "cliente@gym.com"
PEPITO_EMAIL = "pepito{index}@gym.com"
ADMIN_PASSWORD = "Admin123!"
COACH_PASSWORD = "Coach123!"
CLIENT_PASSWORD = "Cliente123!"
PEPITO_PASSWORD = "Pepito123!"


def get_or_create_user(email, password, first_name, last_name, role, phone=""):
    usuario, creado = User.objects.get_or_create(
        email=email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "phone": phone,
        },
    )
    if creado:
        usuario.set_password(password)
        # Mantener consistencia con flags por rol
        if role == User.Role.ADMINISTRADOR:
            usuario.is_staff = True
            usuario.is_superuser = True
        elif role == User.Role.ENTRENADOR:
            usuario.is_staff = True
        usuario.save()
        print(f"Creado usuario {email} ({role})")
    else:
        print(f"Usuario {email} ya existía, se mantuvo la información actual")
    return usuario


def create_core_users():
    admin = get_or_create_user(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        "Admin",
        "Principal",
        User.Role.ADMINISTRADOR,
        phone="3001234567",
    )
    coach = get_or_create_user(
        COACH_EMAIL,
        COACH_PASSWORD,
        "Carla",
        "Entrenadora",
        User.Role.ENTRENADOR,
        phone="3009876543",
    )
    client = get_or_create_user(
        CLIENT_EMAIL,
        CLIENT_PASSWORD,
        "Carlos",
        "Cliente",
        User.Role.CLIENTE,
        phone="3007654321",
    )
    pepitos = []
    for index in range(1, 11):
        pepitos.append(
            get_or_create_user(
                PEPITO_EMAIL.format(index=index),
                PEPITO_PASSWORD,
                f"Pepito {index}",
                "Gómez",
                User.Role.CLIENTE,
                phone=f"30000000{index:02d}",
            )
        )
    return admin, coach, client, pepitos


def create_membership_plans():
    plans = [
        {
            "name": "Mensual",
            "description": "Acceso ilimitado durante 30 días",
            "price": Decimal("50.00"),
            "duration_days": 30,
        },
        {
            "name": "Trimestral",
            "description": "Paquete de 60 días con seguimiento básico",
            "price": Decimal("100.00"),
            "duration_days": 60,
        },
        {
            "name": "Semestral",
            "description": "Cobertura completa durante 120 días con asesorías",
            "price": Decimal("180.00"),
            "duration_days": 120,
        },
    ]

    memberships = []
    for data in plans:
        membership, _ = MembershipPlan.objects.get_or_create(name=data["name"], defaults=data)
        memberships.append(membership)
    print(f"Hay {MembershipPlan.objects.count()} planes de membresía registrados")
    return memberships


def create_machines():
    if Machine is None:
        print("Modelo Machine no disponible; omitiendo carga de máquinas.")
        return []

    field_names = {field.name for field in Machine._meta.get_fields() if field.concrete and not field.auto_created}
    identifier_field = "name" if "name" in field_names else ("nombre" if "nombre" in field_names else None)
    if identifier_field is None:
        print("No se encontró un campo identificador para Machine; omitiendo carga de máquinas.")
        return []

    machines_catalog = [
        "Caminadora NordicTrack", "Bicicleta estática ProForm", "Remadora Concept2",
        "Elíptica LifeFitness", "Press banca Hammer Strength", "Multipower TechnoGym",
        "Mancuernas Rogue", "Kettlebells Competition", "Rack de sentadillas Rogue", "Cuerda de batalla TRX",
    ]

    created = []
    for description in machines_catalog:
        defaults = {}
        if "description" in field_names:
            defaults["description"] = f"{description} disponible en sala principal"
        if "is_active" in field_names:
            defaults["is_active"] = True
        machine, _ = Machine.objects.get_or_create(
            **{identifier_field: description},
            defaults=defaults,
        )
        created.append(machine)
    print(f"Hay {Machine.objects.count()} máquinas registradas")
    return created


def assign_memberships(clients, memberships):
    assignments = []
    today = date.today()

    for index, client in enumerate(clients):
        membership = memberships[index % len(memberships)]
        start = today - timedelta(days=(index + 1) * 5)
        courtesy_days = 5 if index % 3 == 0 else 0
        end = start + timedelta(days=membership.duration_days + courtesy_days)
        assignment, created = ClientMembership.objects.get_or_create(
            user=client,
            membership=membership,
            start_date=start,
            defaults={
                "end_date": end,
                "status": ClientMembership.Status.ACTIVA,
            },
        )
        if not created and assignment.end_date != end:
            assignment.end_date = end
            assignment.status = ClientMembership.Status.ACTIVA
            assignment.save(update_fields=["end_date", "status"])
        assignments.append({
            "instance": assignment,
            "courtesy_days": courtesy_days,
        })
        print(
            f"Asignada membresía {membership.name} a {client.email}"
            f" (cortesía: {courtesy_days} días)"
        )

    return assignments


def create_payments(assignments):
    for assignment_info in assignments:
        assignment = assignment_info["instance"]
        payment, created = Payment.objects.get_or_create(
            client_membership=assignment,
            payment_date=assignment.start_date + timedelta(days=1),
            defaults={
                "amount": assignment.membership.price,
                "payment_method": Payment.Method.TRANSFERENCIA,
            },
        )
        if created:
            print(
                "Registrado pago de",
                f"{payment.amount} para {assignment.membership.name} de {assignment.client_membership.user.email}",
            )


def create_reservations(clients, machines):
    if Reservation is None or not machines:
        print("Modelo Reservation o máquinas no disponibles; omitiendo reservas.")
        return

    field_names = {field.name for field in Reservation._meta.get_fields() if field.concrete and not field.auto_created}
    user_field = next((field for field in ("user", "cliente", "member") if field in field_names), None)
    machine_field = next((field for field in ("machine", "maquina", "equipment") if field in field_names), None)
    start_field = next((field for field in ("start_time", "start_at", "start", "fecha_inicio") if field in field_names), None)
    end_field = next((field for field in ("end_time", "end_at", "end", "fecha_fin") if field in field_names), None)

    if not all([user_field, machine_field, start_field, end_field]):
        print("No se pudieron identificar los campos requeridos para Reservation; omitiendo reservas.")
        return

    status_field = next((field for field in ("status", "estado") if field in field_names), None)
    courtesy_field = next((field for field in ("courtesy_days", "dias_cortesia") if field in field_names), None)
    status_value = None
    if status_field:
        status_class = getattr(Reservation, 'Status', None)
        for candidate in ("CONFIRMADA", "RESERVADA", "ACTIVA"):
            status_value = getattr(status_class, candidate, None) if status_class else candidate.title()
            if status_value:
                break

    base_datetime = datetime.combine(date.today() + timedelta(days=1), time(hour=6, minute=0))
    slot_duration = timedelta(hours=1)

    for index, client in enumerate(clients[: len(machines)]):
        machine = machines[index]
        start_value = base_datetime + slot_duration * index
        end_value = start_value + slot_duration

        lookup = {
            user_field: client,
            machine_field: machine,
            start_field: start_value,
        }
        defaults = {end_field: end_value}
        if status_field and status_value:
            defaults[status_field] = status_value
        if courtesy_field:
            defaults[courtesy_field] = 0

        start_field_obj = Reservation._meta.get_field(start_field)
        end_field_obj = Reservation._meta.get_field(end_field)
        if isinstance(start_field_obj, django_models.DateField) and not isinstance(start_value, date):
            lookup[start_field] = start_value.date()
        if isinstance(end_field_obj, django_models.DateField) and not isinstance(end_value, date):
            defaults[end_field] = end_value.date()

        reservation, created = Reservation.objects.get_or_create(
            **lookup,
            defaults=defaults,
        )
        if created:
            print(
                f"Reserva creada para {client.email} en {getattr(machine, 'name', getattr(machine, 'nombre', machine.id))}"
            )


def summarize_credentials(users):
    print("\nDatos de ejemplo listos. Puedes iniciar sesión en el frontend con:")
    for label, email, password in users:
        print(f"  • {email} / {password} ({label})")


if __name__ == "__main__":
    admin, coach, client, pepitos = create_core_users()
    memberships = create_membership_plans()
    machines = create_machines()

    client_assignments = assign_memberships([client], memberships)
    pepito_assignments = assign_memberships(pepitos, memberships)
    create_payments(client_assignments + pepito_assignments)
    create_reservations(pepitos, machines)

    summarize_credentials(
        [
            ("Administrador (superusuario)", ADMIN_EMAIL, ADMIN_PASSWORD),
            ("Entrenador", COACH_EMAIL, COACH_PASSWORD),
            ("Cliente demo", CLIENT_EMAIL, CLIENT_PASSWORD),
        ]
        + [("Cliente", PEPITO_EMAIL.format(index=i), PEPITO_PASSWORD) for i in range(1, 11)]
    )
