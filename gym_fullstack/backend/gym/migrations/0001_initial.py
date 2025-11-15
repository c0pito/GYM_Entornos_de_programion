# Generated manually due to offline environment
from django.db import migrations, models
import django.core.validators
import django.utils.timezone
import gym.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('first_name', models.CharField(max_length=150)),
                ('last_name', models.CharField(max_length=150)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('role', models.CharField(choices=[('Administrador', 'Administrador'), ('Entrenador', 'Entrenador'), ('Cliente', 'Cliente')], default='Cliente', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('date_joined', models.DateTimeField(auto_now_add=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'abstract': False,
            },
            managers=[
                ('objects', gym.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Machine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120, unique=True)),
                ('description', models.TextField(blank=True)),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ('name',),
            },
        ),
        migrations.CreateModel(
            name='MembershipPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150, unique=True)),
                ('price_usd', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ('total_days', models.PositiveIntegerField()),
                ('active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ('name',),
            },
        ),
        migrations.CreateModel(
            name='UserMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('activated_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('bonus_days', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('plan', models.ForeignKey(on_delete=models.deletion.PROTECT, related_name='activations', to='gym.membershipplan')),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='memberships', to='gym.user')),
            ],
            options={
                'ordering': ('-activated_at',),
            },
        ),
        migrations.CreateModel(
            name='Reservation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('machine', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='reservations', to='gym.machine')),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='reservations', to='gym.user')),
            ],
            options={
                'ordering': ('start_time',),
            },
        ),
        migrations.AddConstraint(
            model_name='reservation',
            constraint=models.UniqueConstraint(fields=('machine', 'start_time'), name='machine_unique_slot_start'),
        ),
    ]
