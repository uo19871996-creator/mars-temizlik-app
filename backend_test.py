#!/usr/bin/env python3
"""
Mars Temizlik Backend API Test Suite
Tests all backend endpoints for the Mars Cleaning appointment booking app.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://mars-scheduling-app.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "admin@marstemizlik.com"
ADMIN_PASSWORD = "admin123"
TEST_CUSTOMER_EMAIL = "test@customer.com"
TEST_CUSTOMER_PASSWORD = "test123"
TEST_CUSTOMER_NAME = "Test Müşteri"
TEST_CUSTOMER_PHONE = "+905551234567"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def success(self, message):
        print(f"{Colors.GREEN}✅ {message}{Colors.END}")
        self.passed += 1
        
    def failure(self, message, error=None):
        print(f"{Colors.RED}❌ {message}{Colors.END}")
        if error:
            print(f"{Colors.RED}   Error: {error}{Colors.END}")
            self.errors.append(f"{message}: {error}")
        self.failed += 1
        
    def info(self, message):
        print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")
        
    def warning(self, message):
        print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def make_request(method, endpoint, data=None, headers=None, expected_status=200):
    """Make HTTP request with error handling"""
    url = f"{API_BASE}{endpoint}"
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'PATCH':
            response = requests.patch(url, json=data, headers=headers, timeout=30)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        return None, str(e)

def test_health_check(results):
    """Test health check endpoint"""
    results.info("Testing health check endpoint...")
    
    response = make_request('GET', '/health')
    if response is None:
        results.failure("Health check failed - no response")
        return False
        
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'healthy':
            results.success("Health check passed")
            return True
        else:
            results.failure("Health check returned unexpected data", data)
    else:
        results.failure(f"Health check failed with status {response.status_code}", response.text)
    
    return False

def test_seed_data(results):
    """Test data seeding"""
    results.info("Testing data seeding...")
    
    response = make_request('POST', '/seed')
    if response is None:
        results.failure("Seed data failed - no response")
        return False
        
    if response.status_code == 200:
        results.success("Data seeding completed")
        return True
    else:
        results.failure(f"Data seeding failed with status {response.status_code}", response.text)
    
    return False

def test_customer_registration(results):
    """Test customer registration"""
    results.info("Testing customer registration...")
    
    # First try to register the test customer
    data = {
        "email": TEST_CUSTOMER_EMAIL,
        "password": TEST_CUSTOMER_PASSWORD,
        "full_name": TEST_CUSTOMER_NAME,
        "phone": TEST_CUSTOMER_PHONE
    }
    
    response = make_request('POST', '/auth/register', data)
    if response is None:
        results.failure("Customer registration failed - no response")
        return None
        
    if response.status_code == 200:
        response_data = response.json()
        if 'token' in response_data and 'user' in response_data:
            results.success("Customer registration successful")
            return response_data['token']
        else:
            results.failure("Registration response missing token or user", response_data)
    elif response.status_code == 400 and "already registered" in response.text:
        results.warning("Customer already exists, trying to login instead")
        return test_customer_login(results)
    else:
        results.failure(f"Customer registration failed with status {response.status_code}", response.text)
    
    return None

def test_customer_login(results):
    """Test customer login"""
    results.info("Testing customer login...")
    
    data = {
        "email": TEST_CUSTOMER_EMAIL,
        "password": TEST_CUSTOMER_PASSWORD
    }
    
    response = make_request('POST', '/auth/login', data)
    if response is None:
        results.failure("Customer login failed - no response")
        return None
        
    if response.status_code == 200:
        response_data = response.json()
        if 'token' in response_data and 'user' in response_data:
            results.success("Customer login successful")
            return response_data['token']
        else:
            results.failure("Login response missing token or user", response_data)
    else:
        results.failure(f"Customer login failed with status {response.status_code}", response.text)
    
    return None

def test_admin_login(results):
    """Test admin login"""
    results.info("Testing admin login...")
    
    data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = make_request('POST', '/auth/login', data)
    if response is None:
        results.failure("Admin login failed - no response")
        return None
        
    if response.status_code == 200:
        response_data = response.json()
        if 'token' in response_data and 'user' in response_data:
            user = response_data['user']
            if user.get('role') == 'admin':
                results.success("Admin login successful")
                return response_data['token']
            else:
                results.failure("Admin login returned non-admin user", user)
        else:
            results.failure("Admin login response missing token or user", response_data)
    else:
        results.failure(f"Admin login failed with status {response.status_code}", response.text)
    
    return None

def test_auth_me(results, token, expected_role):
    """Test /auth/me endpoint"""
    results.info(f"Testing /auth/me endpoint for {expected_role}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = make_request('GET', '/auth/me', headers=headers)
    
    if response is None:
        results.failure("Auth me failed - no response")
        return None
        
    if response.status_code == 200:
        user_data = response.json()
        if user_data.get('role') == expected_role:
            results.success(f"Auth me successful for {expected_role}")
            return user_data
        else:
            results.failure(f"Auth me returned wrong role. Expected: {expected_role}, Got: {user_data.get('role')}")
    else:
        results.failure(f"Auth me failed with status {response.status_code}", response.text)
    
    return None

def test_get_services(results):
    """Test getting services list"""
    results.info("Testing services endpoint...")
    
    response = make_request('GET', '/services')
    if response is None:
        results.failure("Get services failed - no response")
        return []
        
    if response.status_code == 200:
        services = response.json()
        if isinstance(services, list) and len(services) > 0:
            results.success(f"Services retrieved successfully ({len(services)} services)")
            return services
        else:
            results.failure("Services endpoint returned empty or invalid data", services)
    else:
        results.failure(f"Get services failed with status {response.status_code}", response.text)
    
    return []

def test_create_appointment(results, customer_token, services):
    """Test creating an appointment"""
    results.info("Testing appointment creation...")
    
    if not services:
        results.failure("Cannot create appointment - no services available")
        return None
        
    # Use the first service
    service = services[0]
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    data = {
        "service_id": service['id'],
        "date": tomorrow,
        "time_slot": "10:00",
        "address": "Test Mahallesi, Test Sokak No:1, İstanbul",
        "notes": "Test randevusu - otomatik test"
    }
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    response = make_request('POST', '/appointments', data, headers)
    
    if response is None:
        results.failure("Create appointment failed - no response")
        return None
        
    if response.status_code == 200:
        response_data = response.json()
        if 'id' in response_data:
            results.success("Appointment created successfully")
            return response_data['id']
        else:
            results.failure("Appointment creation response missing ID", response_data)
    else:
        results.failure(f"Create appointment failed with status {response.status_code}", response.text)
    
    return None

def test_get_appointments_customer(results, customer_token):
    """Test getting appointments as customer"""
    results.info("Testing get appointments (customer view)...")
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    response = make_request('GET', '/appointments', headers=headers)
    
    if response is None:
        results.failure("Get appointments (customer) failed - no response")
        return []
        
    if response.status_code == 200:
        appointments = response.json()
        if isinstance(appointments, list):
            results.success(f"Customer appointments retrieved ({len(appointments)} appointments)")
            return appointments
        else:
            results.failure("Appointments endpoint returned invalid data", appointments)
    else:
        results.failure(f"Get appointments (customer) failed with status {response.status_code}", response.text)
    
    return []

def test_get_appointments_admin(results, admin_token):
    """Test getting appointments as admin"""
    results.info("Testing get appointments (admin view)...")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request('GET', '/appointments', headers=headers)
    
    if response is None:
        results.failure("Get appointments (admin) failed - no response")
        return []
        
    if response.status_code == 200:
        appointments = response.json()
        if isinstance(appointments, list):
            results.success(f"Admin appointments retrieved ({len(appointments)} appointments)")
            return appointments
        else:
            results.failure("Appointments endpoint returned invalid data", appointments)
    else:
        results.failure(f"Get appointments (admin) failed with status {response.status_code}", response.text)
    
    return []

def test_get_specific_appointment(results, appointment_id, token, role):
    """Test getting a specific appointment"""
    results.info(f"Testing get specific appointment ({role})...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = make_request('GET', f'/appointments/{appointment_id}', headers=headers)
    
    if response is None:
        results.failure(f"Get specific appointment ({role}) failed - no response")
        return None
        
    if response.status_code == 200:
        appointment = response.json()
        if 'id' in appointment:
            results.success(f"Specific appointment retrieved ({role})")
            return appointment
        else:
            results.failure("Specific appointment response missing ID", appointment)
    else:
        results.failure(f"Get specific appointment ({role}) failed with status {response.status_code}", response.text)
    
    return None

def test_update_appointment_status(results, appointment_id, admin_token, status):
    """Test updating appointment status"""
    results.info(f"Testing appointment status update to '{status}'...")
    
    data = {"status": status}
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = make_request('PATCH', f'/appointments/{appointment_id}', data, headers)
    
    if response is None:
        results.failure(f"Update appointment status to '{status}' failed - no response")
        return False
        
    if response.status_code == 200:
        results.success(f"Appointment status updated to '{status}'")
        return True
    else:
        results.failure(f"Update appointment status to '{status}' failed with status {response.status_code}", response.text)
    
    return False

def test_create_review(results, appointment_id, customer_token):
    """Test creating a review for completed appointment"""
    results.info("Testing review creation...")
    
    data = {
        "appointment_id": appointment_id,
        "rating": 5,
        "comment": "Mükemmel hizmet! Çok memnun kaldım. Test yorumu."
    }
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    response = make_request('POST', '/reviews', data, headers)
    
    if response is None:
        results.failure("Create review failed - no response")
        return None
        
    if response.status_code == 200:
        response_data = response.json()
        if 'id' in response_data:
            results.success("Review created successfully")
            return response_data['id']
        else:
            results.failure("Review creation response missing ID", response_data)
    else:
        results.failure(f"Create review failed with status {response.status_code}", response.text)
    
    return None

def test_get_reviews(results):
    """Test getting reviews list"""
    results.info("Testing reviews endpoint...")
    
    response = make_request('GET', '/reviews')
    if response is None:
        results.failure("Get reviews failed - no response")
        return []
        
    if response.status_code == 200:
        reviews = response.json()
        if isinstance(reviews, list):
            results.success(f"Reviews retrieved successfully ({len(reviews)} reviews)")
            return reviews
        else:
            results.failure("Reviews endpoint returned invalid data", reviews)
    else:
        results.failure(f"Get reviews failed with status {response.status_code}", response.text)
    
    return []

def test_cancel_appointment(results, appointment_id, customer_token):
    """Test cancelling an appointment"""
    results.info("Testing appointment cancellation...")
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    response = make_request('DELETE', f'/appointments/{appointment_id}', headers=headers)
    
    if response is None:
        results.failure("Cancel appointment failed - no response")
        return False
        
    if response.status_code == 200:
        results.success("Appointment cancelled successfully")
        return True
    else:
        results.failure(f"Cancel appointment failed with status {response.status_code}", response.text)
    
    return False

def test_authorization(results, customer_token, admin_appointments):
    """Test authorization - customer shouldn't see other customer's appointments"""
    results.info("Testing authorization (customer access to other appointments)...")
    
    if not admin_appointments:
        results.warning("No appointments available for authorization test")
        return
    
    # Try to access an appointment that doesn't belong to the test customer
    for appointment in admin_appointments:
        # Skip if this is the test customer's appointment
        if appointment.get('user_info', {}).get('email') == TEST_CUSTOMER_EMAIL:
            continue
            
        headers = {"Authorization": f"Bearer {customer_token}"}
        response = make_request('GET', f'/appointments/{appointment["id"]}', headers=headers)
        
        if response is None:
            results.failure("Authorization test failed - no response")
            return
            
        if response.status_code == 403:
            results.success("Authorization working - customer cannot access other's appointments")
            return
        elif response.status_code == 200:
            results.failure("Authorization failed - customer can access other's appointments")
            return
        else:
            results.failure(f"Authorization test unexpected status {response.status_code}", response.text)
            return
    
    results.warning("No other customer appointments found for authorization test")

def main():
    """Main test function"""
    print(f"{Colors.BLUE}🧪 Mars Temizlik Backend API Test Suite{Colors.END}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.END}")
    print("=" * 60)
    
    results = TestResults()
    
    # Test 1: Health Check
    if not test_health_check(results):
        print(f"{Colors.RED}❌ Backend is not responding. Stopping tests.{Colors.END}")
        return
    
    # Test 2: Seed Data
    test_seed_data(results)
    
    # Test 3: Customer Registration/Login
    customer_token = test_customer_registration(results)
    if not customer_token:
        customer_token = test_customer_login(results)
    
    if not customer_token:
        results.failure("Cannot proceed without customer token")
        return
    
    # Test 4: Admin Login
    admin_token = test_admin_login(results)
    if not admin_token:
        results.failure("Cannot proceed without admin token")
        return
    
    # Test 5: Auth Me endpoints
    test_auth_me(results, customer_token, "customer")
    test_auth_me(results, admin_token, "admin")
    
    # Test 6: Get Services
    services = test_get_services(results)
    
    # Test 7: Create Appointment
    appointment_id = test_create_appointment(results, customer_token, services)
    
    # Test 8: Get Appointments (Customer View)
    customer_appointments = test_get_appointments_customer(results, customer_token)
    
    # Test 9: Get Appointments (Admin View)
    admin_appointments = test_get_appointments_admin(results, admin_token)
    
    # Test 10: Get Specific Appointment
    if appointment_id:
        test_get_specific_appointment(results, appointment_id, customer_token, "customer")
        test_get_specific_appointment(results, appointment_id, admin_token, "admin")
    
    # Test 11: Update Appointment Status (Admin)
    if appointment_id and admin_token:
        test_update_appointment_status(results, appointment_id, admin_token, "confirmed")
        test_update_appointment_status(results, appointment_id, admin_token, "in_progress")
        test_update_appointment_status(results, appointment_id, admin_token, "completed")
    
    # Test 12: Create Review
    if appointment_id:
        review_id = test_create_review(results, appointment_id, customer_token)
    
    # Test 13: Get Reviews
    test_get_reviews(results)
    
    # Test 14: Authorization Test
    test_authorization(results, customer_token, admin_appointments)
    
    # Test 15: Cancel Appointment (create a new one first)
    if services:
        cancel_appointment_id = test_create_appointment(results, customer_token, services)
        if cancel_appointment_id:
            test_cancel_appointment(results, cancel_appointment_id, customer_token)
    
    # Final Results
    print("\n" + "=" * 60)
    print(f"{Colors.BLUE}📊 Test Results Summary{Colors.END}")
    print(f"{Colors.GREEN}✅ Passed: {results.passed}{Colors.END}")
    print(f"{Colors.RED}❌ Failed: {results.failed}{Colors.END}")
    
    if results.errors:
        print(f"\n{Colors.RED}🚨 Critical Issues Found:{Colors.END}")
        for error in results.errors:
            print(f"{Colors.RED}   • {error}{Colors.END}")
    
    if results.failed == 0:
        print(f"\n{Colors.GREEN}🎉 All tests passed! Backend API is working correctly.{Colors.END}")
        return 0
    else:
        print(f"\n{Colors.RED}⚠️  {results.failed} test(s) failed. Please check the issues above.{Colors.END}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)