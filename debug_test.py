#!/usr/bin/env python3
import os
import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000/api")

# Login as member
login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
    "email": "member@herculesgym.com", 
    "password": "member123"
})

print(f"Login status: {login_response.status_code}")
if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"Token: {token[:50]}...")
    
    # Test members endpoint
    headers = {'Authorization': f'Bearer {token}'}
    try:
        members_response = requests.get(f"{BACKEND_URL}/members", headers=headers)
        print(f"Members endpoint status: {members_response.status_code}")
        print(f"Members response: {members_response.text}")
    except Exception as e:
        print(f"Exception: {e}")
        
    # Test announcements POST
    try:
        ann_data = {"title": "Test", "content": "Test", "target": "all"}
        ann_response = requests.post(f"{BACKEND_URL}/announcements", headers=headers, json=ann_data)
        print(f"Announcements POST status: {ann_response.status_code}")
        print(f"Announcements response: {ann_response.text}")
    except Exception as e:
        print(f"Exception: {e}")
        
    # Test admin dashboard
    try:
        dashboard_response = requests.get(f"{BACKEND_URL}/dashboard/admin", headers=headers)
        print(f"Admin dashboard status: {dashboard_response.status_code}")
        print(f"Admin dashboard response: {dashboard_response.text}")
    except Exception as e:
        print(f"Exception: {e}")
