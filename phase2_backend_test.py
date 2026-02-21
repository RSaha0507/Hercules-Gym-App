#!/usr/bin/env python3
"""
Hercules Gym Management App - Phase 2 Backend API Testing
Testing Centers, Approvals, Merchandise, Orders, and Dashboard APIs
"""

import os
import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000/api")
ADMIN_EMAIL = "admin@herculesgym.com"
ADMIN_PASSWORD = "admin123"

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def success(self, test_name: str):
        self.passed += 1
        print(f"✅ {test_name}")
        
    def failure(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ {test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.errors:
            print(f"\n{'='*60}")
            print(f"FAILED TESTS:")
            print(f"{'='*60}")
            for error in self.errors:
                print(f"• {error}")

class HerculesPhase2Tester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.result = TestResult()
        
    def login_admin(self) -> bool:
        """Login as admin and get token"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                self.result.success("Admin Login")
                return True
            else:
                self.result.failure("Admin Login", f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.result.failure("Admin Login", str(e))
            return False
    
    def test_centers_api(self):
        """Test GET /api/centers"""
        try:
            response = self.session.get(f"{BASE_URL}/centers")
            
            if response.status_code == 200:
                data = response.json()
                expected_centers = ["Ranaghat", "Chakdah", "Madanpur"]
                
                if "centers" in data and data["centers"] == expected_centers:
                    self.result.success("Centers API - Correct centers returned")
                else:
                    self.result.failure("Centers API", f"Expected centers {expected_centers}, got {data}")
            else:
                self.result.failure("Centers API", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.result.failure("Centers API", str(e))
    
    def test_registration_with_center(self):
        """Test POST /api/auth/register with center selection"""
        test_cases = [
            {
                "name": "Member Registration",
                "data": {
                    "email": f"testmember_{int(datetime.now().timestamp())}@test.com",
                    "phone": "9876543210",
                    "full_name": "Test Member",
                    "password": "testpass123",
                    "role": "member",
                    "center": "Ranaghat"
                }
            },
            {
                "name": "Trainer Registration", 
                "data": {
                    "email": f"testtrainer_{int(datetime.now().timestamp())}@test.com",
                    "phone": "9876543211",
                    "full_name": "Test Trainer",
                    "password": "testpass123",
                    "role": "trainer",
                    "center": "Chakdah"
                }
            }
        ]
        
        for test_case in test_cases:
            try:
                # Remove auth header for registration
                headers = self.session.headers.copy()
                if "Authorization" in self.session.headers:
                    del self.session.headers["Authorization"]
                
                response = self.session.post(f"{BASE_URL}/auth/register", json=test_case["data"])
                
                # Restore auth header
                self.session.headers = headers
                
                if response.status_code == 200:
                    data = response.json()
                    user = data.get("user", {})
                    
                    # Check if approval_status is pending for new users
                    if user.get("approval_status") == "pending":
                        self.result.success(f"{test_case['name']} - Approval status pending")
                    else:
                        self.result.failure(f"{test_case['name']}", f"Expected approval_status 'pending', got {user.get('approval_status')}")
                        
                    # Check center assignment
                    if user.get("center") == test_case["data"]["center"]:
                        self.result.success(f"{test_case['name']} - Center assigned correctly")
                    else:
                        self.result.failure(f"{test_case['name']}", f"Expected center {test_case['data']['center']}, got {user.get('center')}")
                        
                else:
                    self.result.failure(f"{test_case['name']}", f"Status: {response.status_code}, Response: {response.text}")
                    
            except Exception as e:
                self.result.failure(f"{test_case['name']}", str(e))
    
    def test_approvals_api(self):
        """Test approval system APIs"""
        try:
            # Test GET /api/approvals/pending
            response = self.session.get(f"{BASE_URL}/approvals/pending")
            
            if response.status_code == 200:
                pending_requests = response.json()
                self.result.success("Get Pending Approvals")
                
                # If there are pending requests, test approve/reject
                if pending_requests:
                    request_id = pending_requests[0]["id"]
                    
                    # Test approve
                    approve_response = self.session.post(f"{BASE_URL}/approvals/{request_id}/approve")
                    if approve_response.status_code == 200:
                        self.result.success("Approve Request")
                    else:
                        self.result.failure("Approve Request", f"Status: {approve_response.status_code}")
                        
                    # Create another test user to test reject
                    test_user_data = {
                        "email": f"testreject_{int(datetime.now().timestamp())}@test.com",
                        "phone": "9876543212",
                        "full_name": "Test Reject User",
                        "password": "testpass123",
                        "role": "member",
                        "center": "Madanpur"
                    }
                    
                    # Remove auth for registration
                    headers = self.session.headers.copy()
                    if "Authorization" in self.session.headers:
                        del self.session.headers["Authorization"]
                    
                    reg_response = self.session.post(f"{BASE_URL}/auth/register", json=test_user_data)
                    
                    # Restore auth
                    self.session.headers = headers
                    
                    if reg_response.status_code == 200:
                        # Get new pending requests
                        pending_response = self.session.get(f"{BASE_URL}/approvals/pending")
                        if pending_response.status_code == 200:
                            new_pending = pending_response.json()
                            if new_pending:
                                reject_id = new_pending[0]["id"]
                                
                                # Test reject with reason
                                reject_response = self.session.post(
                                    f"{BASE_URL}/approvals/{reject_id}/reject",
                                    json={"reason": "Test rejection"}
                                )
                                if reject_response.status_code == 200:
                                    self.result.success("Reject Request with Reason")
                                else:
                                    self.result.failure("Reject Request", f"Status: {reject_response.status_code}")
                else:
                    self.result.success("No pending approvals to test approve/reject")
                    
            else:
                self.result.failure("Get Pending Approvals", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.result.failure("Approvals API", str(e))
    
    def test_merchandise_api(self):
        """Test merchandise APIs"""
        try:
            # Test GET /api/merchandise
            response = self.session.get(f"{BASE_URL}/merchandise")
            
            if response.status_code == 200:
                merchandise_items = response.json()
                self.result.success("Get Merchandise Items")
                
                # Test POST /api/merchandise (Admin only)
                test_item = {
                    "name": "Test Gym T-Shirt",
                    "description": "High quality cotton t-shirt with Hercules logo",
                    "price": 599.0,
                    "category": "Apparel",
                    "sizes": ["S", "M", "L", "XL"],
                    "stock": {"S": 10, "M": 15, "L": 12, "XL": 8},
                    "image": None
                }
                
                create_response = self.session.post(f"{BASE_URL}/merchandise", json=test_item)
                if create_response.status_code == 200:
                    self.result.success("Create Merchandise Item (Admin)")
                    
                    # Store item ID for order testing
                    created_item = create_response.json()
                    self.test_merchandise_id = created_item.get("id")
                else:
                    self.result.failure("Create Merchandise Item", f"Status: {create_response.status_code}, Response: {create_response.text}")
                    
            else:
                self.result.failure("Get Merchandise Items", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.result.failure("Merchandise API", str(e))
    
    def test_orders_api(self):
        """Test orders APIs"""
        try:
            # First create a test member to place order
            test_member_data = {
                "email": f"testbuyer_{int(datetime.now().timestamp())}@test.com",
                "phone": "9876543213",
                "full_name": "Test Buyer",
                "password": "testpass123",
                "center": "Ranaghat",
                "membership": {
                    "plan_name": "Monthly",
                    "start_date": datetime.now().isoformat(),
                    "end_date": datetime.now().replace(month=datetime.now().month+1 if datetime.now().month < 12 else 1, year=datetime.now().year + (1 if datetime.now().month == 12 else 0)).isoformat(),
                    "amount": 2000.0,
                    "is_active": True,
                    "payment_status": "paid"
                }
            }
            
            member_response = self.session.post(f"{BASE_URL}/members", json=test_member_data)
            
            if member_response.status_code == 200:
                member_data = member_response.json()
                member_user_id = member_data["user_id"]
                
                # Login as the member to place order
                headers = self.session.headers.copy()
                if "Authorization" in self.session.headers:
                    del self.session.headers["Authorization"]
                
                login_response = self.session.post(f"{BASE_URL}/auth/login", json={
                    "email": test_member_data["email"],
                    "password": test_member_data["password"]
                })
                
                if login_response.status_code == 200:
                    member_token = login_response.json()["access_token"]
                    self.session.headers.update({"Authorization": f"Bearer {member_token}"})
                    
                    # Get merchandise items to order
                    merch_response = self.session.get(f"{BASE_URL}/merchandise")
                    if merch_response.status_code == 200:
                        items = merch_response.json()
                        if items:
                            # Test POST /api/merchandise/order (based on backend code)
                            test_order = {
                                "items": [
                                    {
                                        "merchandise_id": items[0]["id"],
                                        "size": "M",
                                        "quantity": 2
                                    }
                                ],
                                "notes": "Test order"
                            }
                            
                            order_response = self.session.post(f"{BASE_URL}/merchandise/order", json=test_order)
                            if order_response.status_code == 200:
                                self.result.success("Create Merchandise Order (Member)")
                                order_data = order_response.json()
                                order_id = order_data.get("id")
                                
                                # Test GET /api/merchandise/orders/my (member's own orders)
                                my_orders_response = self.session.get(f"{BASE_URL}/merchandise/orders/my")
                                if my_orders_response.status_code == 200:
                                    self.result.success("Get My Orders (Member)")
                                else:
                                    self.result.failure("Get My Orders", f"Status: {my_orders_response.status_code}")
                                
                                # Switch back to admin to test admin order management
                                self.session.headers = headers
                                
                                # Test GET all orders (Admin)
                                all_orders_response = self.session.get(f"{BASE_URL}/merchandise/orders/all")
                                if all_orders_response.status_code == 200:
                                    self.result.success("Get All Orders (Admin)")
                                    
                                    # Test PUT /api/merchandise/orders/{id}/status (Admin)
                                    if order_id:
                                        status_response = self.session.put(
                                            f"{BASE_URL}/merchandise/orders/{order_id}/status",
                                            params={"new_status": "confirmed"}
                                        )
                                        if status_response.status_code == 200:
                                            self.result.success("Update Order Status (Admin)")
                                        else:
                                            self.result.failure("Update Order Status", f"Status: {status_response.status_code}")
                                else:
                                    self.result.failure("Get All Orders", f"Status: {all_orders_response.status_code}")
                            else:
                                self.result.failure("Create Merchandise Order", f"Status: {order_response.status_code}, Response: {order_response.text}")
                        else:
                            self.result.failure("Create Order", "No merchandise items available")
                    else:
                        self.result.failure("Get Merchandise for Order", f"Status: {merch_response.status_code}")
                else:
                    self.result.failure("Member Login for Order", f"Status: {login_response.status_code}")
                    
                # Restore admin session
                self.session.headers = headers
            else:
                self.result.failure("Create Test Member for Order", f"Status: {member_response.status_code}")
                
        except Exception as e:
            self.result.failure("Orders API", str(e))
    
    def test_dashboard_with_center_filter(self):
        """Test dashboard APIs with center filtering"""
        try:
            # Test GET /api/dashboard/admin without center filter
            response = self.session.get(f"{BASE_URL}/dashboard/admin")
            
            if response.status_code == 200:
                dashboard_data = response.json()
                expected_fields = [
                    "total_members", "active_members", "total_trainers", 
                    "today_attendance", "monthly_revenue", "expiring_memberships",
                    "pending_approvals", "pending_orders", "centers"
                ]
                
                missing_fields = [field for field in expected_fields if field not in dashboard_data]
                if not missing_fields:
                    self.result.success("Admin Dashboard - All fields present")
                else:
                    self.result.failure("Admin Dashboard", f"Missing fields: {missing_fields}")
                
                # Check if centers are correct
                if dashboard_data.get("centers") == ["Ranaghat", "Chakdah", "Madanpur"]:
                    self.result.success("Admin Dashboard - Centers correct")
                else:
                    self.result.failure("Admin Dashboard", f"Incorrect centers: {dashboard_data.get('centers')}")
                    
            else:
                self.result.failure("Admin Dashboard", f"Status: {response.status_code}, Response: {response.text}")
            
            # Test GET /api/dashboard/admin?center=Ranaghat
            center_response = self.session.get(f"{BASE_URL}/dashboard/admin?center=Ranaghat")
            
            if center_response.status_code == 200:
                center_data = center_response.json()
                self.result.success("Admin Dashboard with Center Filter")
                
                # The filtered data should have same structure but potentially different counts
                if all(field in center_data for field in expected_fields):
                    self.result.success("Admin Dashboard Center Filter - All fields present")
                else:
                    missing = [field for field in expected_fields if field not in center_data]
                    self.result.failure("Admin Dashboard Center Filter", f"Missing fields: {missing}")
            else:
                self.result.failure("Admin Dashboard Center Filter", f"Status: {center_response.status_code}")
                
        except Exception as e:
            self.result.failure("Dashboard API", str(e))
    
    def test_role_based_access_control(self):
        """Test that role-based access control is working"""
        try:
            # Create a member and try to access admin-only endpoints
            test_member_data = {
                "email": f"testaccess_{int(datetime.now().timestamp())}@test.com",
                "phone": "9876543214",
                "full_name": "Test Access Member",
                "password": "testpass123",
                "center": "Ranaghat",
            }
            
            member_response = self.session.post(f"{BASE_URL}/members", json=test_member_data)
            
            if member_response.status_code == 200:
                # Login as member
                headers = self.session.headers.copy()
                if "Authorization" in self.session.headers:
                    del self.session.headers["Authorization"]
                
                login_response = self.session.post(f"{BASE_URL}/auth/login", json={
                    "email": test_member_data["email"],
                    "password": test_member_data["password"]
                })
                
                if login_response.status_code == 200:
                    member_token = login_response.json()["access_token"]
                    self.session.headers.update({"Authorization": f"Bearer {member_token}"})
                    
                    # Try to access admin-only endpoints
                    admin_endpoints = [
                        (f"{BASE_URL}/dashboard/admin", "Admin Dashboard"),
                        (f"{BASE_URL}/merchandise/orders/all", "All Orders")
                    ]
                    
                    for endpoint, name in admin_endpoints:
                        response = self.session.get(endpoint)
                        if response.status_code == 403:
                            self.result.success(f"Access Control - Member blocked from {name}")
                        else:
                            self.result.failure(f"Access Control", f"Member should be blocked from {name}, got status {response.status_code}")
                
                # Restore admin session
                self.session.headers = headers
            else:
                self.result.failure("Create Test Member for Access Control", f"Status: {member_response.status_code}")
                
        except Exception as e:
            self.result.failure("Role-Based Access Control", str(e))
    
    def run_all_tests(self):
        """Run all Phase 2 API tests"""
        print("🚀 Starting Hercules Gym Phase 2 Backend API Tests")
        print(f"Base URL: {BASE_URL}")
        print("="*60)
        
        # Login as admin first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return
        
        # Run all tests
        self.test_centers_api()
        self.test_registration_with_center()
        self.test_approvals_api()
        self.test_merchandise_api()
        self.test_orders_api()
        self.test_dashboard_with_center_filter()
        self.test_role_based_access_control()
        
        # Print summary
        self.result.summary()
        
        return self.result.failed == 0

def main():
    tester = HerculesPhase2Tester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All Phase 2 API tests passed!")
        sys.exit(0)
    else:
        print(f"\n💥 {tester.result.failed} test(s) failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
