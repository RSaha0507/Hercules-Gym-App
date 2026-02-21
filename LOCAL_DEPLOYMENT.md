# Hercules Gym Management App - Local Deployment Guide

## Prerequisites (Already Installed ✓)
- Node.js v24.12.0
- npm v11.9.0
- Python 3.13.12
- MongoDB (running on localhost:27017)

## Quick Start

### Option 1: Using Batch Files (Windows)

1. **Start the Backend:**
   ```bash
   start-backend.bat
   ```
   This will:
   - Activate the Python virtual environment
   - Start the FastAPI server on http://127.0.0.1:8001

2. **Start the Frontend (in a new terminal):**
   ```bash
   start-frontend.bat
   ```
   This will:
   - Start the Expo development server
   - Provide options to run on Android emulator, iOS simulator, or web browser

### Option 2: Manual Start

1. **Backend:**
   ```bash
   cd backend
   ..\.venv\Scripts\activate
   python -m uvicorn server:app --host 127.0.0.1 --port 8001
   ```

2. **Frontend (in a new terminal):**
   ```bash
   cd frontend
   npx expo start
   ```

## Accessing the Application

### Backend API
- **Base URL:** http://127.0.0.1:8001
- **API Documentation:** http://127.0.0.1:8001/docs (Swagger UI)
- **Health Check:** http://127.0.0.1:8001/api/health

### Frontend Mobile App
After running `npx expo start`, you can:
- Press `a` to open in Android emulator (if installed)
- Press `i` to open in iOS simulator (Mac only)
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your physical device

## Default Admin Account

The app comes with a primary admin account pre-configured:
- **Email:** admin@herculesgym.com
- **Password:** admin123

**⚠️ Important:** Change the admin password immediately after first login!

## Features

### Multi-Center Support
- Three gym centers: Ranaghat, Chakdah, Madanpur
- Center-specific data and management

### Role-Based Access
- **Admin:** Full system access, user management, approvals
- **Trainer:** Member management, workout plans, diet charts
- **Member:** Personal dashboard, attendance, messages

### Key Features
- ✅ User authentication with JWT
- ✅ QR code attendance tracking
- ✅ Real-time messaging with Socket.io
- ✅ Push notifications
- ✅ Dark/Light theme support
- ✅ Merchandise store
- ✅ Workout and diet management
- ✅ Payment tracking
- ✅ Multi-center support

## Troubleshooting

### Backend Won't Start
1. Ensure MongoDB is running: `mongod --version`
2. Check if port 8001 is available
3. Verify virtual environment is activated

### Frontend Won't Start
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`
3. Clear Expo cache: `npx expo start --clear`

### Database Connection Issues
1. Verify MongoDB is running on port 27017
2. Check backend/.env file has correct MONGO_URL
3. Database "hercules_gym" will be created automatically

## Environment Variables

### Backend (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hercules_gym"
```

### Frontend (.env)
```env
EXPO_USE_FAST_RESOLVER=1
```

Local development automatically uses `http://127.0.0.1:8001`.
For preview/production APK/AAB builds, set `EXPO_PUBLIC_BACKEND_URL` in EAS environment variables.

## Development

### Running Tests
Backend tests are available in `backend_test.py` and `phase2_backend_test.py`

### API Testing
Use the Swagger UI at http://127.0.0.1:8001/docs for interactive API testing

## Production Deployment

For production deployment, ensure:
1. Set a strong `SECRET_KEY` via environment variable
2. Use environment variables for sensitive data
3. Set up proper CORS origins
4. Use HTTPS
5. Configure proper MongoDB security
6. Set up proper push notification credentials
