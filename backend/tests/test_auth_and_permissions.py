import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, UserRole

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def customer_user(db):
    return User.objects.create_user(
        username='cust@smartbank.local',
        email='cust@smartbank.local',
        password='Password123!',
        role=UserRole.CUSTOMER
    )

@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username='staff@smartbank.local',
        email='staff@smartbank.local',
        password='Password123!',
        role=UserRole.STAFF
    )

@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username='admin@smartbank.local',
        email='admin@smartbank.local',
        password='Password123!',
        role=UserRole.ADMIN
    )

@pytest.mark.django_db
def test_valid_and_invalid_login(client, customer_user):
    # Invalid password
    res = client.post('/api/v1/auth/login/', {'email': 'cust@smartbank.local', 'password': 'WrongPassword!'})
    assert res.status_code == 400
    assert 'non_field_errors' in res.data or 'error' in res.data

    # Valid password
    res = client.post('/api/v1/auth/login/', {'email': 'cust@smartbank.local', 'password': 'Password123!'})
    assert res.status_code == 200
    assert 'token' in res.data
    assert res.data['user']['email'] == 'cust@smartbank.local'

@pytest.mark.django_db
def test_customer_access_restrictions(client, customer_user):
    client.force_authenticate(user=customer_user)

    # Customer cannot access staff reports overview
    res = client.get('/api/v1/reporting/overview/')
    assert res.status_code == 403

    # Customer cannot access admin staff management
    res = client.get('/api/v1/auth/staff/')
    assert res.status_code == 403

@pytest.mark.django_db
def test_staff_access_permissions(client, staff_user):
    client.force_authenticate(user=staff_user)

    # Staff CAN access reports overview
    res = client.get('/api/v1/reporting/overview/')
    assert res.status_code == 200
    assert 'metrics' in res.data

    # Staff cannot create staff accounts (admin only)
    res = client.post('/api/v1/auth/staff/', {'email': 'newstaff@smartbank.local', 'role': 'STAFF'})
    assert res.status_code == 403

@pytest.mark.django_db
def test_admin_access_permissions(client, admin_user):
    client.force_authenticate(user=admin_user)

    # Admin CAN access staff management
    res = client.get('/api/v1/auth/staff/')
    assert res.status_code == 200
