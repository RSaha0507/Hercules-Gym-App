#!/usr/bin/env python3
"""
Hercules Gym Management API Backend Test Suite
Tests all backend endpoints with role-based access control
"""

import os
import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Optional

# Get backend URL from environment or assume local dev server
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000/api")

# Pre-created test users
TEST_USERS = {
    "admin": {"email": "admin@herculesgym.com", "password": "admin123"},
    "trainer": {"email": "trainer@herculesgym.com", "password": "trainer123"},
    "member": {"email": "member@herculesgym.com", "password": "member123"}
}

class HerculesAPITester:
    def __init__(self):
        self.tokens = {}
        self.users = {}
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, test_name: str, success: bool, message: str = "", details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if details:
            print(f"    Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
        
    def make_request(self, method: str, endpoint: str, token: str = None, **kwargs) -> requests.Response:
        """Make authenticated request"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        kwargs['headers'] = headers
        
        try:
            # Use a fresh request instead of session to avoid connection issues
            response = requests.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None
            
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication ===")
        
        # Test login for all users
        for role, credentials in TEST_USERS.items():
            try:
                response = self.make_request('POST', '/auth/login', json=credentials)
                
                if response and response.status_code == 200:
                    data = response.json()
                    self.tokens[role] = data['access_token']
                    self.users[role] = data['user']
                    self.log_test(f"Login as {role}", True, f"Token received for {credentials['email']}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test(f"Login as {role}", False, f"Failed to login: {error_msg}")
                    
            except Exception as e:
                self.log_test(f"Login as {role}", False, f"Exception: {str(e)}")
                
        # Test /auth/me for each user
        for role in self.tokens:
            try:
                response = self.make_request('GET', '/auth/me', token=self.tokens[role])
                
                if response and response.status_code == 200:
                    user_data = response.json()
                    expected_role = role
                    actual_role = user_data.get('role')
                    
                    if actual_role == expected_role:
                        self.log_test(f"Get current user ({role})", True, f"Role verified: {actual_role}")
                    else:
                        self.log_test(f"Get current user ({role})", False, f"Role mismatch: expected {expected_role}, got {actual_role}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test(f"Get current user ({role})", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test(f"Get current user ({role})", False, f"Exception: {str(e)}")
                
    def test_members_management(self):
        """Test member management endpoints"""
        print("\n=== Testing Members Management ===")
        
        # Test GET /members as admin
        if 'admin' in self.tokens:
            try:
                response = self.make_request('GET', '/members', token=self.tokens['admin'])
                
                if response and response.status_code == 200:
                    members = response.json()
                    self.log_test("Get all members (admin)", True, f"Retrieved {len(members)} members")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Get all members (admin)", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Get all members (admin)", False, f"Exception: {str(e)}")
                
        # Test GET /members as trainer
        if 'trainer' in self.tokens:
            try:
                response = self.make_request('GET', '/members', token=self.tokens['trainer'])
                
                if response and response.status_code == 200:
                    members = response.json()
                    self.log_test("Get assigned members (trainer)", True, f"Retrieved {len(members)} assigned members")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Get assigned members (trainer)", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Get assigned members (trainer)", False, f"Exception: {str(e)}")
                
        # Test GET /members as member (should fail)
        if 'member' in self.tokens:
            try:
                response = self.make_request('GET', '/members', token=self.tokens['member'])
                
                if response and response.status_code == 403:
                    self.log_test("Get members (member - should fail)", True, "Correctly denied access")
                else:
                    self.log_test("Get members (member - should fail)", False, f"Expected 403, got {response.status_code if response else 'No response'}")
                    
            except Exception as e:
                self.log_test("Get members (member - should fail)", False, f"Exception: {str(e)}")
                
        # Test GET /members/{user_id} - member accessing own data
        if 'member' in self.tokens and 'member' in self.users:
            member_id = self.users['member']['id']
            try:
                response = self.make_request('GET', f'/members/{member_id}', token=self.tokens['member'])
                
                if response and response.status_code == 200:
                    member_data = response.json()
                    self.log_test("Get own member details", True, "Member can access own data")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Get own member details", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Get own member details", False, f"Exception: {str(e)}")
                
        # Test POST /members (create new member) as admin
        if 'admin' in self.tokens:
            new_member_data = {
                "email": f"testmember{datetime.now().strftime('%Y%m%d%H%M%S')}@herculesgym.com",
                "phone": "1234567890",
                "full_name": "Test Member",
                "password": "testpass123",
                "gender": "male",
                "address": "123 Test Street"
            }
            
            try:
                response = self.make_request('POST', '/members', token=self.tokens['admin'], json=new_member_data)
                
                if response and response.status_code == 200:
                    result = response.json()
                    self.log_test("Create new member (admin)", True, f"Created member with ID: {result.get('member_id')}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Create new member (admin)", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Create new member (admin)", False, f"Exception: {str(e)}")
                
    def test_attendance_system(self):
        """Test attendance endpoints"""
        print("\n=== Testing Attendance System ===")
        
        # Test member self check-in
        if 'member' in self.tokens and 'member' in self.users:
            member_id = self.users['member']['id']
            check_in_data = {
                "user_id": member_id,
                "method": "self"
            }
            
            try:
                response = self.make_request('POST', '/attendance/check-in', token=self.tokens['member'], json=check_in_data)
                
                if response and response.status_code == 200:
                    result = response.json()
                    self.log_test("Member self check-in", True, "Successfully checked in")
                elif response and response.status_code == 400 and "Already checked in" in response.text:
                    self.log_test("Member self check-in", True, "Already checked in today (expected)")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Member self check-in", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Member self check-in", False, f"Exception: {str(e)}")
                
        # Test check-out
        if 'member' in self.tokens and 'member' in self.users:
            member_id = self.users['member']['id']
            
            try:
                response = self.make_request('POST', f'/attendance/check-out/{member_id}', token=self.tokens['member'])
                
                if response and response.status_code == 200:
                    self.log_test("Member check-out", True, "Successfully checked out")
                elif response and response.status_code == 400:
                    error_msg = response.json().get('detail', 'No active check-in found')
                    self.log_test("Member check-out", True, f"Expected error: {error_msg}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Member check-out", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Member check-out", False, f"Exception: {str(e)}")
                
        # Test get today's attendance
        for role in ['admin', 'trainer', 'member']:
            if role in self.tokens:
                try:
                    response = self.make_request('GET', '/attendance/today', token=self.tokens[role])
                    
                    if response and response.status_code == 200:
                        attendance = response.json()
                        self.log_test(f"Get today's attendance ({role})", True, f"Retrieved {len(attendance)} records")
                    else:
                        error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                        self.log_test(f"Get today's attendance ({role})", False, f"Failed: {error_msg}")
                        
                except Exception as e:
                    self.log_test(f"Get today's attendance ({role})", False, f"Exception: {str(e)}")
                    
        # Test attendance history
        if 'member' in self.tokens and 'member' in self.users:
            member_id = self.users['member']['id']
            
            try:
                response = self.make_request('GET', f'/attendance/history/{member_id}', token=self.tokens['member'])
                
                if response and response.status_code == 200:
                    history = response.json()
                    self.log_test("Get attendance history (member)", True, f"Retrieved {len(history)} records")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Get attendance history (member)", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Get attendance history (member)", False, f"Exception: {str(e)}")
                
    def test_messaging_system(self):
        """Test messaging endpoints with role restrictions"""
        print("\n=== Testing Messaging System ===")
        
        # Test member trying to message another member (should fail)
        if 'member' in self.tokens and 'admin' in self.users:
            # Try to send message to admin (should work)
            admin_id = self.users['admin']['id']
            message_data = {
                "receiver_id": admin_id,
                "content": "Hello admin, I have a question about my membership.",
                "message_type": "text"
            }
            
            try:
                response = self.make_request('POST', '/messages', token=self.tokens['member'], json=message_data)
                
                if response and response.status_code == 200:
                    self.log_test("Member message to admin", True, "Successfully sent message to admin")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Member message to admin", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Member message to admin", False, f"Exception: {str(e)}")
                
        # Test member trying to message trainer (should work if assigned)
        if 'member' in self.tokens and 'trainer' in self.users:
            trainer_id = self.users['trainer']['id']
            message_data = {
                "receiver_id": trainer_id,
                "content": "Hi trainer, can you help me with my workout plan?",
                "message_type": "text"
            }
            
            try:
                response = self.make_request('POST', '/messages', token=self.tokens['member'], json=message_data)
                
                if response and response.status_code == 200:
                    self.log_test("Member message to trainer", True, "Successfully sent message to trainer")
                elif response and response.status_code == 403:
                    self.log_test("Member message to trainer", True, "Correctly denied - trainer not assigned")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Member message to trainer", False, f"Unexpected response: {error_msg}")
                    
            except Exception as e:
                self.log_test("Member message to trainer", False, f"Exception: {str(e)}")
                
        # Test getting conversations
        for role in ['admin', 'trainer', 'member']:
            if role in self.tokens:
                try:
                    response = self.make_request('GET', '/conversations', token=self.tokens[role])
                    
                    if response and response.status_code == 200:
                        conversations = response.json()
                        self.log_test(f"Get conversations ({role})", True, f"Retrieved {len(conversations)} conversations")
                    else:
                        error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                        self.log_test(f"Get conversations ({role})", False, f"Failed: {error_msg}")
                        
                except Exception as e:
                    self.log_test(f"Get conversations ({role})", False, f"Exception: {str(e)}")
                    
        # Test getting messages between users
        if 'member' in self.tokens and 'admin' in self.users:
            admin_id = self.users['admin']['id']
            
            try:
                response = self.make_request('GET', f'/messages/{admin_id}', token=self.tokens['member'])
                
                if response and response.status_code == 200:
                    messages = response.json()
                    self.log_test("Get messages with admin", True, f"Retrieved {len(messages)} messages")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Get messages with admin", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Get messages with admin", False, f"Exception: {str(e)}")
                
    def test_announcements(self):
        """Test announcement endpoints"""
        print("\n=== Testing Announcements ===")
        
        # Test creating announcement as admin
        if 'admin' in self.tokens:
            announcement_data = {
                "title": "Test Announcement",
                "content": "This is a test announcement for all members.",
                "target": "all",
                "target_users": []
            }
            
            try:
                response = self.make_request('POST', '/announcements', token=self.tokens['admin'], json=announcement_data)
                
                if response and response.status_code == 200:
                    result = response.json()
                    self.log_test("Create announcement (admin)", True, f"Created announcement: {result.get('title')}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Create announcement (admin)", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Create announcement (admin)", False, f"Exception: {str(e)}")
                
        # Test creating announcement as member (should fail)
        if 'member' in self.tokens:
            announcement_data = {
                "title": "Member Announcement",
                "content": "This should fail.",
                "target": "all"
            }
            
            try:
                response = self.make_request('POST', '/announcements', token=self.tokens['member'], json=announcement_data)
                
                if response and response.status_code == 403:
                    self.log_test("Create announcement (member - should fail)", True, "Correctly denied access")
                else:
                    self.log_test("Create announcement (member - should fail)", False, f"Expected 403, got {response.status_code if response else 'No response'}")
                    
            except Exception as e:
                self.log_test("Create announcement (member - should fail)", False, f"Exception: {str(e)}")
                
        # Test getting announcements
        for role in ['admin', 'trainer', 'member']:
            if role in self.tokens:
                try:
                    response = self.make_request('GET', '/announcements', token=self.tokens[role])
                    
                    if response and response.status_code == 200:
                        announcements = response.json()
                        self.log_test(f"Get announcements ({role})", True, f"Retrieved {len(announcements)} announcements")
                    else:
                        error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                        self.log_test(f"Get announcements ({role})", False, f"Failed: {error_msg}")
                        
                except Exception as e:
                    self.log_test(f"Get announcements ({role})", False, f"Exception: {str(e)}")
                    
    def test_dashboards(self):
        """Test dashboard endpoints"""
        print("\n=== Testing Dashboards ===")
        
        # Test admin dashboard
        if 'admin' in self.tokens:
            try:
                response = self.make_request('GET', '/dashboard/admin', token=self.tokens['admin'])
                
                if response and response.status_code == 200:
                    dashboard = response.json()
                    required_fields = ['total_members', 'active_members', 'total_trainers', 'today_attendance', 'monthly_revenue']
                    missing_fields = [field for field in required_fields if field not in dashboard]
                    
                    if not missing_fields:
                        self.log_test("Admin dashboard", True, f"All required fields present")
                    else:
                        self.log_test("Admin dashboard", False, f"Missing fields: {missing_fields}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Admin dashboard", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Admin dashboard", False, f"Exception: {str(e)}")
                
        # Test trainer dashboard
        if 'trainer' in self.tokens:
            try:
                response = self.make_request('GET', '/dashboard/trainer', token=self.tokens['trainer'])
                
                if response and response.status_code == 200:
                    dashboard = response.json()
                    required_fields = ['assigned_members', 'today_attendance', 'unread_messages']
                    missing_fields = [field for field in required_fields if field not in dashboard]
                    
                    if not missing_fields:
                        self.log_test("Trainer dashboard", True, f"All required fields present")
                    else:
                        self.log_test("Trainer dashboard", False, f"Missing fields: {missing_fields}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Trainer dashboard", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Trainer dashboard", False, f"Exception: {str(e)}")
                
        # Test member dashboard
        if 'member' in self.tokens:
            try:
                response = self.make_request('GET', '/dashboard/member', token=self.tokens['member'])
                
                if response and response.status_code == 200:
                    dashboard = response.json()
                    required_fields = ['membership_valid', 'days_remaining', 'attendance_this_month', 'unread_messages']
                    missing_fields = [field for field in required_fields if field not in dashboard]
                    
                    if not missing_fields:
                        self.log_test("Member dashboard", True, f"All required fields present")
                    else:
                        self.log_test("Member dashboard", False, f"Missing fields: {missing_fields}")
                else:
                    error_msg = response.json().get('detail', 'Unknown error') if response else "No response"
                    self.log_test("Member dashboard", False, f"Failed: {error_msg}")
                    
            except Exception as e:
                self.log_test("Member dashboard", False, f"Exception: {str(e)}")
                
        # Test role-based access control for dashboards
        if 'member' in self.tokens:
            try:
                response = self.make_request('GET', '/dashboard/admin', token=self.tokens['member'])
                
                if response and response.status_code == 403:
                    self.log_test("Member accessing admin dashboard (should fail)", True, "Correctly denied access")
                else:
                    self.log_test("Member accessing admin dashboard (should fail)", False, f"Expected 403, got {response.status_code if response else 'No response'}")
                    
            except Exception as e:
                self.log_test("Member accessing admin dashboard (should fail)", False, f"Exception: {str(e)}")
                
    def run_all_tests(self):
        """Run all test suites"""
        print("🏋️ Starting Hercules Gym Management API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        
        self.test_authentication()
        self.test_members_management()
        self.test_attendance_system()
        self.test_messaging_system()
        self.test_announcements()
        self.test_dashboards()
        
        # Summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n=== TEST SUMMARY ===")
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n=== FAILED TESTS ===")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['message']}")
                    if result['details']:
                        print(f"   {result['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = HerculesAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
