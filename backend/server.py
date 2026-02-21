from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
import socketio
from bson import ObjectId
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment
APP_ENV = os.environ.get("APP_ENV", os.environ.get("ENVIRONMENT", "development")).lower()
IS_PRODUCTION = APP_ENV in {"production", "prod"} or os.environ.get("RENDER", "").lower() == "true"


def parse_origins(origins_value: str):
    origins_value = (origins_value or "*").strip()
    if origins_value == "*":
        return "*"
    return [origin.strip() for origin in origins_value.split(",") if origin.strip()]


def read_int_env(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


# JWT Settings
secret_key_env = os.environ.get("SECRET_KEY")
if IS_PRODUCTION and not secret_key_env:
    raise RuntimeError("SECRET_KEY must be set in production environment.")

SECRET_KEY = secret_key_env or "dev-only-secret-key-change-me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Gym Centers
GYM_CENTERS = ["Ranaghat", "Chakdah", "Madanpur"]
CenterType = Literal["Ranaghat", "Chakdah", "Madanpur"]

# Password hashing
pwd_context = CryptContext(
    # Use pbkdf2 for all new hashes to avoid runtime bcrypt backend issues.
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL") or os.environ.get("MONGODB_URI") or "mongodb://localhost:27017"
db_name = os.environ.get("DB_NAME", "hercules_gym")
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=read_int_env("MONGO_SERVER_SELECTION_TIMEOUT_MS", 5000),
    connectTimeoutMS=read_int_env("MONGO_CONNECT_TIMEOUT_MS", 10000),
)
db = client[db_name]

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Hercules Gym Management API")

# Socket.IO setup
socket_cors_origins = parse_origins(os.environ.get("SOCKET_CORS_ORIGINS", os.environ.get("CORS_ORIGINS", "*")))
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=socket_cors_origins)
socket_app = socketio.ASGIApp(sio, app)

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

RoleType = Literal["admin", "trainer", "member"]
ApprovalStatus = Literal["pending", "approved", "rejected"]

# User Models
class UserBase(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    role: RoleType
    center: Optional[CenterType] = None

class UserCreate(UserBase):
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    password: str
    role: RoleType
    center: Optional[CenterType] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True
    profile_image: Optional[str] = None
    is_primary_admin: bool = False
    approval_status: ApprovalStatus = "approved"
    push_token: Optional[str] = None

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    is_active: bool = True
    profile_image: Optional[str] = None
    is_primary_admin: bool = False
    approval_status: ApprovalStatus = "approved"
    push_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Member Profile Models
class EmergencyContact(BaseModel):
    name: str
    phone: str
    relationship: str

class BodyMetrics(BaseModel):
    date: datetime = Field(default_factory=datetime.utcnow)
    weight: Optional[float] = None
    height: Optional[float] = None
    body_fat: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    biceps: Optional[float] = None
    thighs: Optional[float] = None

class MembershipPlan(BaseModel):
    plan_name: str
    start_date: datetime
    end_date: datetime
    amount: float
    is_active: bool = True
    payment_status: Literal["paid", "pending", "overdue"] = "pending"
    next_payment_date: Optional[datetime] = None
    last_reminder_sent: Optional[datetime] = None

class MemberProfile(BaseModel):
    user_id: str
    member_id: str
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[EmergencyContact] = None
    assigned_trainers: List[str] = []
    membership: Optional[MembershipPlan] = None
    body_metrics: List[BodyMetrics] = []
    medical_notes: Optional[str] = None
    goals: Optional[str] = None
    progress_photos: List[str] = []

class MemberProfileCreate(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
    password: str
    center: CenterType
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[EmergencyContact] = None
    membership: Optional[MembershipPlan] = None
    medical_notes: Optional[str] = None
    goals: Optional[str] = None
    assigned_trainers: List[str] = []

class MemberProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    center: Optional[CenterType] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[EmergencyContact] = None
    membership: Optional[MembershipPlan] = None
    medical_notes: Optional[str] = None
    goals: Optional[str] = None
    assigned_trainers: Optional[List[str]] = None

# Approval Request Models
class ApprovalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_email: str
    user_role: RoleType
    center: Optional[CenterType] = None
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    status: ApprovalStatus = "pending"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

# Attendance Models
class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    center: CenterType
    check_in_time: datetime = Field(default_factory=datetime.utcnow)
    check_out_time: Optional[datetime] = None
    method: Literal["qr", "manual", "self"] = "manual"
    marked_by: Optional[str] = None

class AttendanceCreate(BaseModel):
    user_id: str
    method: Literal["qr", "manual", "self"] = "manual"

# Message Models
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    message_type: Literal["text", "image", "pdf"] = "text"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    message_type: Literal["text", "image", "pdf"] = "text"

# Notification Models
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    body: str
    notification_type: Literal["approval", "payment", "merchandise", "announcement", "general"] = "general"
    data: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

# Announcement Models
class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    target: Literal["all", "members", "trainers", "selected", "center"] = "all"
    target_center: Optional[CenterType] = None
    target_users: List[str] = []
    is_active: bool = True

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target: Literal["all", "members", "trainers", "selected", "center"] = "all"
    target_center: Optional[CenterType] = None
    target_users: List[str] = []

# Merchandise Models
class MerchandiseItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    sizes: List[str] = ["S", "M", "L", "XL"]
    stock: dict = {}  # {"S": 10, "M": 15, ...}
    image: Optional[str] = None  # Base64
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MerchandiseCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    sizes: List[str] = ["S", "M", "L", "XL"]
    stock: dict = {}
    image: Optional[str] = None

class MerchandiseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    sizes: Optional[List[str]] = None
    stock: Optional[dict] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None

class CartItem(BaseModel):
    merchandise_id: str
    size: str
    quantity: int = 1

class MerchandiseOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    center: CenterType
    items: List[dict] = []  # [{merchandise_id, name, size, quantity, price}]
    total_amount: float
    status: Literal["pending", "confirmed", "ready", "collected", "cancelled"] = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    notes: Optional[str] = None

class MerchandiseOrderCreate(BaseModel):
    items: List[CartItem]
    notes: Optional[str] = None

# Payment Models
class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    amount: float
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: str = "cash"
    description: str = ""
    status: Literal["pending", "completed", "failed"] = "completed"
    recorded_by: str
    center: CenterType

class PaymentCreate(BaseModel):
    member_id: str
    amount: float
    payment_method: str = "cash"
    description: str = ""
    status: Literal["pending", "completed", "failed"] = "completed"
    next_payment_date: Optional[datetime] = None

# Workout Models
class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    weight: Optional[float] = None
    notes: Optional[str] = None
    completed: bool = False

class WorkoutPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    member_id: str
    trainer_id: str
    exercises: List[Exercise] = []
    day_of_week: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class WorkoutPlanCreate(BaseModel):
    name: str
    member_id: str
    exercises: List[Exercise] = []
    day_of_week: Optional[str] = None
    notes: Optional[str] = None

# Diet Models
class Meal(BaseModel):
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    description: str
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fats: Optional[float] = None

class DietPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    member_id: str
    trainer_id: str
    meals: List[Meal] = []
    pdf_content: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class DietPlanCreate(BaseModel):
    name: str
    member_id: str
    meals: List[Meal] = []
    pdf_content: Optional[str] = None
    notes: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Backward compatibility: verify existing bcrypt hashes directly.
    if hashed_password.startswith("$2"):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except ValueError:
            return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

async def require_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_primary_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role != "admin" or not current_user.is_primary_admin:
        raise HTTPException(status_code=403, detail="Primary Admin access required")
    return current_user

async def require_admin_or_trainer(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Admin or Trainer access required")
    return current_user

async def generate_member_id() -> str:
    count = await db.member_profiles.count_documents({})
    return f"HG{str(count + 1).zfill(4)}"

def sanitize_mongo_doc(doc):
    """Remove MongoDB _id field from document"""
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

# ==================== PUSH NOTIFICATION FUNCTIONS ====================

async def send_push_notification(push_token: str, title: str, body: str, data: dict = {}):
    """Send push notification via Expo"""
    if not push_token:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": push_token,
                    "title": title,
                    "body": body,
                    "data": data,
                    "sound": "default",
                    "priority": "high"
                },
                headers={"Content-Type": "application/json"}
            )
            logger.info(f"Push notification sent: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")

async def send_notification_to_user(user_id: str, title: str, body: str, notification_type: str = "general", data: dict = {}):
    """Create notification record and send push notification"""
    # Save notification to database
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data
    )
    await db.notifications.insert_one(notification.dict())
    
    # Get user's push token
    user = await db.users.find_one({"id": user_id})
    if user and user.get("push_token"):
        await send_push_notification(user["push_token"], title, body, data)
    
    # Emit socket event
    await sio.emit(f"notification_{user_id}", notification.dict())

async def notify_all_admins(title: str, body: str, notification_type: str = "general", data: dict = {}):
    """Send notification to all admins"""
    admins = await db.users.find({"role": "admin", "is_active": True, "approval_status": "approved"}).to_list(100)
    for admin in admins:
        await send_notification_to_user(admin["id"], title, body, notification_type, data)

async def notify_center_trainers(center: str, title: str, body: str, notification_type: str = "general", data: dict = {}):
    """Send notification to trainers at a specific center"""
    trainers = await db.users.find({"role": "trainer", "center": center, "is_active": True, "approval_status": "approved"}).to_list(100)
    for trainer in trainers:
        await send_notification_to_user(trainer["id"], title, body, notification_type, data)

# ==================== PAYMENT REMINDER BACKGROUND TASK ====================

async def check_payment_reminders():
    """Background task to check and send payment reminders"""
    while True:
        try:
            today = datetime.utcnow().date()
            reminder_start = today + timedelta(days=2)
            
            # Find members with upcoming payments
            profiles = await db.member_profiles.find({
                "membership.payment_status": {"$in": ["pending", "overdue"]},
                "membership.next_payment_date": {"$lte": datetime.combine(reminder_start, datetime.max.time())}
            }).to_list(1000)
            
            for profile in profiles:
                membership = profile.get("membership", {})
                next_payment = membership.get("next_payment_date")
                last_reminder = membership.get("last_reminder_sent")
                
                if not next_payment:
                    continue
                
                # Check if we should send reminder (once per day)
                if last_reminder:
                    last_reminder_date = last_reminder.date() if isinstance(last_reminder, datetime) else last_reminder
                    if last_reminder_date == today:
                        continue
                
                # Calculate days until payment
                payment_date = next_payment.date() if isinstance(next_payment, datetime) else next_payment
                days_until = (payment_date - today).days
                
                if days_until <= 2:
                    user = await db.users.find_one({"id": profile["user_id"]})
                    if user:
                        if days_until < 0:
                            title = "Payment Overdue!"
                            body = f"Your gym subscription payment is overdue by {abs(days_until)} day(s). Please pay immediately."
                        elif days_until == 0:
                            title = "Payment Due Today!"
                            body = "Your gym subscription payment is due today. Please make the payment."
                        else:
                            title = "Payment Reminder"
                            body = f"Your gym subscription payment is due in {days_until} day(s)."
                        
                        await send_notification_to_user(
                            user["id"], 
                            title, 
                            body, 
                            "payment",
                            {"payment_date": str(next_payment), "member_id": profile["member_id"]}
                        )
                        
                        # Update last reminder sent
                        await db.member_profiles.update_one(
                            {"user_id": profile["user_id"]},
                            {"$set": {"membership.last_reminder_sent": datetime.utcnow()}}
                        )
            
            # Sleep for 1 hour before next check
            await asyncio.sleep(3600)
        except Exception as e:
            logger.error(f"Payment reminder error: {e}")
            await asyncio.sleep(3600)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if this is the first admin (becomes primary admin)
    is_first_admin = False
    if user.role == "admin":
        admin_count = await db.users.count_documents({"role": "admin"})
        is_first_admin = admin_count == 0
    
    # Determine approval status
    approval_status = "approved" if is_first_admin else "pending"
    if user.role == "member":
        approval_status = "pending"  # Members need trainer approval
    
    # Validate center for trainers and members
    if user.role in ["trainer", "member"] and not user.center:
        raise HTTPException(status_code=400, detail="Center is required for trainers and members")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_dict = {
        "id": user_id,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": user.role,
        "center": user.center,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": None,
        "is_primary_admin": is_first_admin,
        "approval_status": approval_status,
        "push_token": None
    }
    
    await db.users.insert_one(user_dict)
    
    # Create member profile if role is member
    if user.role == "member":
        member_id = await generate_member_id()
        profile = {
            "user_id": user_id,
            "member_id": member_id,
            "assigned_trainers": [],
            "body_metrics": [],
            "progress_photos": []
        }
        await db.member_profiles.insert_one(profile)
    
    # Create approval request if not primary admin
    if approval_status == "pending":
        approval_request = ApprovalRequest(
            user_id=user_id,
            user_name=user.full_name,
            user_email=user.email,
            user_role=user.role,
            center=user.center
        )
        await db.approval_requests.insert_one(approval_request.dict())
        
        # Send notification
        if user.role in ["admin", "trainer"]:
            # Notify primary admin
            primary_admin = await db.users.find_one({"is_primary_admin": True})
            if primary_admin:
                await send_notification_to_user(
                    primary_admin["id"],
                    "New Approval Request",
                    f"{user.full_name} has requested to join as {user.role} at {user.center or 'HQ'}",
                    "approval",
                    {"request_id": approval_request.id, "user_id": user_id}
                )
        elif user.role == "member":
            # Notify trainers at that center
            await notify_center_trainers(
                user.center,
                "New Member Registration",
                f"{user.full_name} has requested to join at {user.center}",
                "approval",
                {"request_id": approval_request.id, "user_id": user_id}
            )
            # Also notify all admins
            await notify_all_admins(
                "New Member Registration",
                f"{user.full_name} has requested to join at {user.center}",
                "approval",
                {"request_id": approval_request.id, "user_id": user_id}
            )
    
    # Generate token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user.email,
        phone=user.phone,
        full_name=user.full_name,
        role=user.role,
        center=user.center,
        created_at=user_dict["created_at"],
        is_active=True,
        is_primary_admin=is_first_admin,
        approval_status=approval_status
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is suspended")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        phone=user["phone"],
        full_name=user["full_name"],
        role=user["role"],
        center=user.get("center"),
        created_at=user["created_at"],
        is_active=user.get("is_active", True),
        profile_image=user.get("profile_image"),
        is_primary_admin=user.get("is_primary_admin", False),
        approval_status=user.get("approval_status", "approved"),
        push_token=user.get("push_token")
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        phone=current_user.phone,
        full_name=current_user.full_name,
        role=current_user.role,
        center=current_user.center,
        created_at=current_user.created_at,
        is_active=current_user.is_active,
        profile_image=current_user.profile_image,
        is_primary_admin=current_user.is_primary_admin,
        approval_status=current_user.approval_status,
        push_token=current_user.push_token
    )

@api_router.put("/auth/push-token")
async def update_push_token(push_token: str, current_user: UserInDB = Depends(get_current_user)):
    await db.users.update_one({"id": current_user.id}, {"$set": {"push_token": push_token}})
    return {"message": "Push token updated"}

@api_router.put("/auth/profile")
async def update_profile(
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    profile_image: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    update_data = {}
    if full_name:
        update_data["full_name"] = full_name
    if phone:
        update_data["phone"] = phone
    if profile_image:
        update_data["profile_image"] = profile_image
    
    if update_data:
        await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}

# ==================== APPROVAL ROUTES ====================

@api_router.get("/approvals/pending")
async def get_pending_approvals(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role == "member":
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"status": "pending"}
    
    if current_user.role == "trainer":
        # Trainers can only see member requests for their center
        query["user_role"] = "member"
        query["center"] = current_user.center
    elif current_user.role == "admin" and not current_user.is_primary_admin:
        # Non-primary admins can see member requests
        query["user_role"] = "member"
    # Primary admin can see all
    
    requests = await db.approval_requests.find(query).sort("requested_at", -1).to_list(100)
    return [sanitize_mongo_doc(r) for r in requests]

@api_router.post("/approvals/{request_id}/approve")
async def approve_request(request_id: str, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role == "member":
        raise HTTPException(status_code=403, detail="Access denied")
    
    request = await db.approval_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Check permission
    if request["user_role"] in ["admin", "trainer"]:
        if not current_user.is_primary_admin:
            raise HTTPException(status_code=403, detail="Only primary admin can approve admins/trainers")
    elif request["user_role"] == "member":
        if current_user.role == "trainer" and current_user.center != request["center"]:
            raise HTTPException(status_code=403, detail="Can only approve members from your center")
    
    # Update approval request
    await db.approval_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "approved",
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow()
        }}
    )
    
    # Update user status
    await db.users.update_one(
        {"id": request["user_id"]},
        {"$set": {"approval_status": "approved"}}
    )
    
    # Notify user
    await send_notification_to_user(
        request["user_id"],
        "Registration Approved!",
        f"Your registration as {request['user_role']} has been approved. Welcome to Hercules Gym!",
        "approval",
        {"status": "approved"}
    )
    
    return {"message": "Request approved"}

@api_router.post("/approvals/{request_id}/reject")
async def reject_request(
    request_id: str,
    reason: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.role == "member":
        raise HTTPException(status_code=403, detail="Access denied")
    
    request = await db.approval_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Check permission
    if request["user_role"] in ["admin", "trainer"]:
        if not current_user.is_primary_admin:
            raise HTTPException(status_code=403, detail="Only primary admin can reject admins/trainers")
    elif request["user_role"] == "member":
        if current_user.role == "trainer" and current_user.center != request["center"]:
            raise HTTPException(status_code=403, detail="Can only reject members from your center")
    
    # Update approval request
    await db.approval_requests.update_one(
        {"id": request_id},
        {"$set": {
            "status": "rejected",
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow(),
            "rejection_reason": reason
        }}
    )
    
    # Update user status
    await db.users.update_one(
        {"id": request["user_id"]},
        {"$set": {"approval_status": "rejected", "is_active": False}}
    )
    
    # Notify user
    await send_notification_to_user(
        request["user_id"],
        "Registration Rejected",
        f"Your registration has been rejected. {reason or 'Please contact the gym for more information.'}",
        "approval",
        {"status": "rejected", "reason": reason}
    )
    
    return {"message": "Request rejected"}

# ==================== MEMBER MANAGEMENT ROUTES ====================

@api_router.post("/members", response_model=dict)
async def create_member(member: MemberProfileCreate, current_user: UserInDB = Depends(require_admin_or_trainer)):
    # Check if email exists
    existing = await db.users.find_one({"email": member.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user account
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(member.password)
    
    user_dict = {
        "id": user_id,
        "email": member.email,
        "phone": member.phone,
        "full_name": member.full_name,
        "role": "member",
        "center": member.center,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": None,
        "is_primary_admin": False,
        "approval_status": "approved",  # Created by admin/trainer, so pre-approved
        "push_token": None
    }
    await db.users.insert_one(user_dict)
    
    # Create member profile
    member_id = await generate_member_id()
    profile = {
        "user_id": user_id,
        "member_id": member_id,
        "date_of_birth": member.date_of_birth,
        "gender": member.gender,
        "address": member.address,
        "emergency_contact": member.emergency_contact.dict() if member.emergency_contact else None,
        "assigned_trainers": member.assigned_trainers or ([current_user.id] if current_user.role == "trainer" else []),
        "membership": member.membership.dict() if member.membership else None,
        "body_metrics": [],
        "medical_notes": member.medical_notes,
        "goals": member.goals,
        "progress_photos": []
    }
    await db.member_profiles.insert_one(profile)
    
    # Notify all admins about new member
    await notify_all_admins(
        "New Member Added",
        f"{member.full_name} has been added as a member at {member.center} by {current_user.full_name}",
        "general",
        {"member_id": member_id, "center": member.center}
    )
    
    return {"user_id": user_id, "member_id": member_id, "message": "Member created successfully"}

@api_router.get("/members")
async def get_members(
    center: Optional[CenterType] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.role == "admin":
        # Admin sees all members, optionally filtered by center
        query = {"role": "member"}
        if center:
            query["center"] = center
        members = await db.users.find(query).to_list(1000)
    elif current_user.role == "trainer":
        # Trainer sees only assigned members at their center
        profiles = await db.member_profiles.find({"assigned_trainers": current_user.id}).to_list(1000)
        user_ids = [p["user_id"] for p in profiles]
        members = await db.users.find({"id": {"$in": user_ids}, "center": current_user.center}).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = []
    for member in members:
        profile = await db.member_profiles.find_one({"user_id": member["id"]})
        result.append({
            "id": member["id"],
            "email": member["email"],
            "phone": member["phone"],
            "full_name": member["full_name"],
            "is_active": member.get("is_active", True),
            "created_at": member["created_at"],
            "profile_image": member.get("profile_image"),
            "center": member.get("center"),
            "member_id": profile["member_id"] if profile else None,
            "membership": profile.get("membership") if profile else None,
            "approval_status": member.get("approval_status", "approved")
        })
    
    return result

@api_router.get("/members/{user_id}")
async def get_member(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Check access
    if current_user.role == "member" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": user_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"id": user_id})
    if not user or user["role"] != "member":
        raise HTTPException(status_code=404, detail="Member not found")
    
    profile = await db.member_profiles.find_one({"user_id": user_id})
    
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "phone": user["phone"],
            "full_name": user["full_name"],
            "is_active": user.get("is_active", True),
            "created_at": user["created_at"],
            "profile_image": user.get("profile_image"),
            "center": user.get("center")
        },
        "profile": sanitize_mongo_doc(profile)
    }

@api_router.put("/members/{user_id}")
async def update_member(
    user_id: str,
    update: MemberProfileUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    # Check access
    if current_user.role == "member":
        if current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Members can only update certain fields
        allowed_fields = ["full_name", "phone", "address", "emergency_contact", "goals"]
        update_dict = {k: v for k, v in update.dict(exclude_unset=True).items() if k in allowed_fields}
    elif current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": user_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Access denied")
        # Trainers can update training-related fields
        allowed_fields = ["goals", "medical_notes", "membership"]
        update_dict = {k: v for k, v in update.dict(exclude_unset=True).items() if k in allowed_fields}
    else:
        # Admin can update everything including center
        update_dict = update.dict(exclude_unset=True)
    
    # Update user fields
    user_fields = {}
    if "full_name" in update_dict:
        user_fields["full_name"] = update_dict.pop("full_name")
    if "phone" in update_dict:
        user_fields["phone"] = update_dict.pop("phone")
    if "center" in update_dict:
        user_fields["center"] = update_dict.pop("center")
    
    if user_fields:
        await db.users.update_one({"id": user_id}, {"$set": user_fields})
    
    # Update profile fields
    if update_dict:
        if "emergency_contact" in update_dict and update_dict["emergency_contact"]:
            update_dict["emergency_contact"] = update_dict["emergency_contact"].dict() if hasattr(update_dict["emergency_contact"], 'dict') else update_dict["emergency_contact"]
        if "membership" in update_dict and update_dict["membership"]:
            update_dict["membership"] = update_dict["membership"].dict() if hasattr(update_dict["membership"], 'dict') else update_dict["membership"]
        await db.member_profiles.update_one({"user_id": user_id}, {"$set": update_dict})
    
    return {"message": "Member updated successfully"}

@api_router.delete("/members/{user_id}")
async def delete_member(user_id: str, current_user: UserInDB = Depends(require_admin)):
    # Soft delete - just deactivate
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    return {"message": "Member deactivated successfully"}

@api_router.put("/members/{user_id}/center")
async def change_member_center(
    user_id: str,
    new_center: CenterType,
    current_user: UserInDB = Depends(require_admin)
):
    """Admin only - change member's center"""
    await db.users.update_one({"id": user_id}, {"$set": {"center": new_center}})
    return {"message": f"Member center changed to {new_center}"}

@api_router.post("/members/{user_id}/metrics")
async def add_body_metrics(
    user_id: str,
    metrics: BodyMetrics,
    current_user: UserInDB = Depends(get_current_user)
):
    # Check access
    if current_user.role == "member" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": user_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Access denied")
    
    await db.member_profiles.update_one(
        {"user_id": user_id},
        {"$push": {"body_metrics": metrics.dict()}}
    )
    
    return {"message": "Metrics added successfully"}

# ==================== TRAINER MANAGEMENT ROUTES ====================

@api_router.post("/trainers")
async def create_trainer(user: UserCreate, current_user: UserInDB = Depends(require_primary_admin)):
    if user.role != "trainer":
        raise HTTPException(status_code=400, detail="Role must be trainer")
    
    if not user.center:
        raise HTTPException(status_code=400, detail="Center is required for trainers")
    
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_dict = {
        "id": user_id,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": "trainer",
        "center": user.center,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": None,
        "is_primary_admin": False,
        "approval_status": "approved",  # Created by primary admin
        "push_token": None
    }
    await db.users.insert_one(user_dict)
    
    return {"user_id": user_id, "message": "Trainer created successfully"}

@api_router.get("/trainers")
async def get_trainers(
    center: Optional[CenterType] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    query = {"role": "trainer", "is_active": True, "approval_status": "approved"}
    if center:
        query["center"] = center
    
    trainers = await db.users.find(query).to_list(1000)
    
    result = []
    for trainer in trainers:
        # Count assigned members
        member_count = await db.member_profiles.count_documents({"assigned_trainers": trainer["id"]})
        result.append({
            "id": trainer["id"],
            "email": trainer["email"],
            "phone": trainer["phone"],
            "full_name": trainer["full_name"],
            "profile_image": trainer.get("profile_image"),
            "center": trainer.get("center"),
            "member_count": member_count
        })
    
    return result

@api_router.put("/trainers/{user_id}/center")
async def change_trainer_center(
    user_id: str,
    new_center: CenterType,
    current_user: UserInDB = Depends(require_admin)
):
    """Admin only - change trainer's center"""
    trainer = await db.users.find_one({"id": user_id, "role": "trainer"})
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"center": new_center}})
    return {"message": f"Trainer center changed to {new_center}"}

# ==================== ATTENDANCE ROUTES ====================

@api_router.post("/attendance/check-in")
async def check_in(attendance: AttendanceCreate, current_user: UserInDB = Depends(get_current_user)):
    # Validate access
    if current_user.role == "member":
        if attendance.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only check in yourself")
        attendance.method = "self"
    elif current_user.role == "trainer":
        # Check if trainer is assigned to this member
        profile = await db.member_profiles.find_one({"user_id": attendance.user_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Not assigned to this member")
    
    # Get user's center
    user = await db.users.find_one({"id": attendance.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already checked in today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.attendance.find_one({
        "user_id": attendance.user_id,
        "check_in_time": {"$gte": today_start},
        "check_out_time": None
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    record = AttendanceRecord(
        user_id=attendance.user_id,
        center=user.get("center", "Ranaghat"),
        method=attendance.method,
        marked_by=current_user.id if current_user.id != attendance.user_id else None
    )
    
    await db.attendance.insert_one(record.dict())
    
    return {"message": "Checked in successfully", "record": record.dict()}

@api_router.post("/attendance/check-out/{user_id}")
async def check_out(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Validate access
    if current_user.role == "member" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only check out yourself")
    
    # Find today's check-in
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    record = await db.attendance.find_one({
        "user_id": user_id,
        "check_in_time": {"$gte": today_start},
        "check_out_time": None
    })
    
    if not record:
        raise HTTPException(status_code=400, detail="No active check-in found")
    
    await db.attendance.update_one(
        {"id": record["id"]},
        {"$set": {"check_out_time": datetime.utcnow()}}
    )
    
    return {"message": "Checked out successfully"}

@api_router.get("/attendance/today")
async def get_today_attendance(
    center: Optional[CenterType] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    if current_user.role == "member":
        records = await db.attendance.find({
            "user_id": current_user.id,
            "check_in_time": {"$gte": today_start}
        }).to_list(100)
    elif current_user.role == "trainer":
        # Get assigned members
        profiles = await db.member_profiles.find({"assigned_trainers": current_user.id}).to_list(1000)
        user_ids = [p["user_id"] for p in profiles]
        query = {
            "user_id": {"$in": user_ids},
            "check_in_time": {"$gte": today_start}
        }
        if center:
            query["center"] = center
        records = await db.attendance.find(query).to_list(1000)
    else:
        # Admin sees all
        query = {"check_in_time": {"$gte": today_start}}
        if center:
            query["center"] = center
        records = await db.attendance.find(query).to_list(1000)
    
    # Enrich with user info
    result = []
    for record in records:
        sanitize_mongo_doc(record)
        user = await db.users.find_one({"id": record["user_id"]})
        if user:
            record["user_name"] = user["full_name"]
            record["user_email"] = user["email"]
        result.append(record)
    
    return result

@api_router.get("/attendance/history/{user_id}")
async def get_attendance_history(
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    # Check access
    if current_user.role == "member" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": user_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"user_id": user_id}
    if start_date:
        query["check_in_time"] = {"$gte": start_date}
    if end_date:
        if "check_in_time" in query:
            query["check_in_time"]["$lte"] = end_date
        else:
            query["check_in_time"] = {"$lte": end_date}
    
    records = await db.attendance.find(query).sort("check_in_time", -1).to_list(1000)
    return [sanitize_mongo_doc(r) for r in records]

@api_router.get("/attendance/qr-code")
async def get_qr_code(current_user: UserInDB = Depends(require_admin)):
    # Generate a unique code for today
    today = datetime.utcnow().strftime("%Y-%m-%d")
    code = f"HERCULES-{today}-{uuid.uuid4().hex[:8].upper()}"
    
    # Store the code
    await db.qr_codes.update_one(
        {"date": today},
        {"$set": {"code": code, "date": today}},
        upsert=True
    )
    
    return {"code": code, "date": today}

@api_router.post("/attendance/qr-check-in")
async def qr_check_in(code: str, current_user: UserInDB = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    stored = await db.qr_codes.find_one({"date": today})
    
    if not stored or stored["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid QR code")
    
    # Check if already checked in
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.attendance.find_one({
        "user_id": current_user.id,
        "check_in_time": {"$gte": today_start}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    record = AttendanceRecord(
        user_id=current_user.id,
        center=current_user.center or "Ranaghat",
        method="qr"
    )
    
    await db.attendance.insert_one(record.dict())
    
    return {"message": "QR Check-in successful", "record": record.dict()}

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(current_user: UserInDB = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [sanitize_mongo_doc(n) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: UserInDB = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: UserInDB = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@api_router.get("/notifications/unread-count")
async def get_unread_notification_count(current_user: UserInDB = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": current_user.id, "read": False})
    return {"count": count}

# ==================== MESSAGING ROUTES ====================

@api_router.post("/messages")
async def send_message(message: MessageCreate, current_user: UserInDB = Depends(get_current_user)):
    # Validate chat permissions
    receiver = await db.users.find_one({"id": message.receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Check allowed communication pairs
    if current_user.role == "member":
        # Members can only message trainers (assigned) or admin
        if receiver["role"] == "member":
            raise HTTPException(status_code=403, detail="Members cannot message other members")
        if receiver["role"] == "trainer":
            profile = await db.member_profiles.find_one({"user_id": current_user.id})
            if not profile or message.receiver_id not in profile.get("assigned_trainers", []):
                raise HTTPException(status_code=403, detail="Can only message assigned trainers")
    
    elif current_user.role == "trainer":
        # Trainers can message assigned members or admin
        if receiver["role"] == "member":
            profile = await db.member_profiles.find_one({"user_id": receiver["id"]})
            if not profile or current_user.id not in profile.get("assigned_trainers", []):
                raise HTTPException(status_code=403, detail="Can only message assigned members")
    
    msg = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content,
        message_type=message.message_type
    )
    
    await db.messages.insert_one(msg.dict())
    
    # Update conversation
    participants = sorted([current_user.id, message.receiver_id])
    await db.conversations.update_one(
        {"participant_ids": participants},
        {
            "$set": {
                "participant_ids": participants,
                "last_message": message.content[:50],
                "last_message_time": msg.created_at
            },
            "$inc": {f"unread_count.{message.receiver_id}": 1}
        },
        upsert=True
    )
    
    # Emit socket event
    await sio.emit(f"message_{message.receiver_id}", msg.dict())
    
    return msg.dict()

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: UserInDB = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user.id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user.id}
        ]
    }).sort("created_at", 1).to_list(1000)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    # Reset unread count
    participants = sorted([current_user.id, other_user_id])
    await db.conversations.update_one(
        {"participant_ids": participants},
        {"$set": {f"unread_count.{current_user.id}": 0}}
    )
    
    return [sanitize_mongo_doc(m) for m in messages]

@api_router.get("/conversations")
async def get_conversations(current_user: UserInDB = Depends(get_current_user)):
    conversations = await db.conversations.find({
        "participant_ids": current_user.id
    }).sort("last_message_time", -1).to_list(100)
    
    result = []
    for conv in conversations:
        other_id = [p for p in conv["participant_ids"] if p != current_user.id][0]
        other_user = await db.users.find_one({"id": other_id})
        if other_user:
            result.append({
                "user_id": other_id,
                "user_name": other_user["full_name"],
                "user_role": other_user["role"],
                "profile_image": other_user.get("profile_image"),
                "last_message": conv.get("last_message"),
                "last_message_time": conv.get("last_message_time"),
                "unread_count": conv.get("unread_count", {}).get(current_user.id, 0)
            })
    
    return result

# ==================== ANNOUNCEMENT ROUTES ====================

@api_router.post("/announcements")
async def create_announcement(
    announcement: AnnouncementCreate,
    current_user: UserInDB = Depends(require_admin)
):
    ann = Announcement(
        title=announcement.title,
        content=announcement.content,
        created_by=current_user.id,
        target=announcement.target,
        target_center=announcement.target_center,
        target_users=announcement.target_users
    )
    
    await db.announcements.insert_one(ann.dict())
    
    # Emit to relevant users
    if announcement.target == "all":
        await sio.emit("announcement", ann.dict())
    elif announcement.target == "members":
        members = await db.users.find({"role": "member"}).to_list(1000)
        for member in members:
            await sio.emit(f"announcement_{member['id']}", ann.dict())
    elif announcement.target == "trainers":
        trainers = await db.users.find({"role": "trainer"}).to_list(1000)
        for trainer in trainers:
            await sio.emit(f"announcement_{trainer['id']}", ann.dict())
    elif announcement.target == "center" and announcement.target_center:
        users = await db.users.find({"center": announcement.target_center}).to_list(1000)
        for user in users:
            await sio.emit(f"announcement_{user['id']}", ann.dict())
    else:
        for user_id in announcement.target_users:
            await sio.emit(f"announcement_{user_id}", ann.dict())
    
    return ann.dict()

@api_router.get("/announcements")
async def get_announcements(current_user: UserInDB = Depends(get_current_user)):
    query = {"is_active": True}
    
    if current_user.role != "admin":
        query["$or"] = [
            {"target": "all"},
            {"target": current_user.role + "s"},
            {"target_users": current_user.id},
            {"target": "center", "target_center": current_user.center}
        ]
    
    announcements = await db.announcements.find(query).sort("created_at", -1).to_list(100)
    
    # Enrich with creator info
    for ann in announcements:
        sanitize_mongo_doc(ann)
        creator = await db.users.find_one({"id": ann["created_by"]})
        if creator:
            ann["creator_name"] = creator["full_name"]
    
    return announcements

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: UserInDB = Depends(require_admin)
):
    await db.announcements.update_one(
        {"id": announcement_id},
        {"$set": {"is_active": False}}
    )
    return {"message": "Announcement deleted"}

# ==================== MERCHANDISE ROUTES ====================

@api_router.post("/merchandise")
async def create_merchandise(
    item: MerchandiseCreate,
    current_user: UserInDB = Depends(require_admin)
):
    merchandise = MerchandiseItem(
        name=item.name,
        description=item.description,
        price=item.price,
        category=item.category,
        sizes=item.sizes,
        stock=item.stock,
        image=item.image
    )
    
    await db.merchandise.insert_one(merchandise.dict())
    return merchandise.dict()

@api_router.get("/merchandise")
async def get_merchandise(current_user: UserInDB = Depends(get_current_user)):
    items = await db.merchandise.find({"is_active": True}).to_list(100)
    return [sanitize_mongo_doc(item) for item in items]

@api_router.get("/merchandise/{item_id}")
async def get_merchandise_item(item_id: str, current_user: UserInDB = Depends(get_current_user)):
    item = await db.merchandise.find_one({"id": item_id, "is_active": True})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return sanitize_mongo_doc(item)

@api_router.put("/merchandise/{item_id}")
async def update_merchandise(
    item_id: str,
    update: MerchandiseUpdate,
    current_user: UserInDB = Depends(require_admin)
):
    update_dict = {k: v for k, v in update.dict(exclude_unset=True).items()}
    if update_dict:
        await db.merchandise.update_one({"id": item_id}, {"$set": update_dict})
    return {"message": "Merchandise updated"}

@api_router.delete("/merchandise/{item_id}")
async def delete_merchandise(item_id: str, current_user: UserInDB = Depends(require_admin)):
    await db.merchandise.update_one({"id": item_id}, {"$set": {"is_active": False}})
    return {"message": "Merchandise deleted"}

@api_router.post("/merchandise/order")
async def create_merchandise_order(
    order: MerchandiseOrderCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    if current_user.role == "admin":
        raise HTTPException(status_code=400, detail="Admins cannot place orders")
    
    # Validate items and calculate total
    order_items = []
    total_amount = 0
    
    for cart_item in order.items:
        item = await db.merchandise.find_one({"id": cart_item.merchandise_id, "is_active": True})
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {cart_item.merchandise_id} not found")
        
        if cart_item.size not in item.get("sizes", []):
            raise HTTPException(status_code=400, detail=f"Size {cart_item.size} not available for {item['name']}")
        
        stock = item.get("stock", {}).get(cart_item.size, 0)
        if stock < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item['name']} ({cart_item.size})")
        
        order_items.append({
            "merchandise_id": cart_item.merchandise_id,
            "name": item["name"],
            "size": cart_item.size,
            "quantity": cart_item.quantity,
            "price": item["price"]
        })
        total_amount += item["price"] * cart_item.quantity
    
    # Create order
    merchandise_order = MerchandiseOrder(
        user_id=current_user.id,
        user_name=current_user.full_name,
        center=current_user.center or "Ranaghat",
        items=order_items,
        total_amount=total_amount,
        notes=order.notes
    )
    
    await db.merchandise_orders.insert_one(merchandise_order.dict())
    
    # Notify all admins
    items_summary = ", ".join([f"{i['name']} ({i['size']}) x{i['quantity']}" for i in order_items])
    await notify_all_admins(
        "New Merchandise Order",
        f"{current_user.full_name} from {current_user.center} ordered: {items_summary}. Total: ₹{total_amount}",
        "merchandise",
        {"order_id": merchandise_order.id, "user_id": current_user.id}
    )
    
    return merchandise_order.dict()

@api_router.get("/merchandise/orders/my")
async def get_my_merchandise_orders(current_user: UserInDB = Depends(get_current_user)):
    orders = await db.merchandise_orders.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [sanitize_mongo_doc(order) for order in orders]

@api_router.get("/merchandise/orders/all")
async def get_all_merchandise_orders(
    center: Optional[CenterType] = None,
    status: Optional[str] = None,
    current_user: UserInDB = Depends(require_admin)
):
    query = {}
    if center:
        query["center"] = center
    if status:
        query["status"] = status
    
    orders = await db.merchandise_orders.find(query).sort("created_at", -1).to_list(1000)
    return [sanitize_mongo_doc(order) for order in orders]

@api_router.put("/merchandise/orders/{order_id}/status")
async def update_merchandise_order_status(
    order_id: str,
    new_status: Literal["pending", "confirmed", "ready", "collected", "cancelled"],
    current_user: UserInDB = Depends(require_admin)
):
    order = await db.merchandise_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.merchandise_orders.update_one(
        {"id": order_id},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
    )
    
    # Notify user
    status_messages = {
        "confirmed": "Your merchandise order has been confirmed!",
        "ready": "Your merchandise order is ready for collection at the gym.",
        "collected": "Your merchandise order has been marked as collected. Thank you!",
        "cancelled": "Your merchandise order has been cancelled."
    }
    
    if new_status in status_messages:
        await send_notification_to_user(
            order["user_id"],
            f"Order {new_status.title()}",
            status_messages[new_status],
            "merchandise",
            {"order_id": order_id, "status": new_status}
        )
    
    return {"message": f"Order status updated to {new_status}"}

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments")
async def create_payment(
    payment: PaymentCreate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    member = await db.users.find_one({"id": payment.member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    pay = Payment(
        member_id=payment.member_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        description=payment.description,
        status=payment.status,
        recorded_by=current_user.id,
        center=member.get("center", "Ranaghat")
    )
    
    await db.payments.insert_one(pay.dict())
    
    # Update membership payment status and next payment date
    update_data = {"membership.payment_status": "paid"}
    if payment.next_payment_date:
        update_data["membership.next_payment_date"] = payment.next_payment_date
        update_data["membership.payment_status"] = "pending"
    
    await db.member_profiles.update_one(
        {"user_id": payment.member_id},
        {"$set": update_data}
    )
    
    # Notify member
    await send_notification_to_user(
        payment.member_id,
        "Payment Recorded",
        f"Your payment of ₹{payment.amount} has been recorded. Thank you!",
        "payment",
        {"amount": payment.amount, "next_payment": str(payment.next_payment_date) if payment.next_payment_date else None}
    )
    
    return pay.dict()

@api_router.get("/payments/{member_id}")
async def get_payments(member_id: str, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role == "member" and current_user.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    payments = await db.payments.find({"member_id": member_id}).sort("payment_date", -1).to_list(100)
    return [sanitize_mongo_doc(p) for p in payments]

# ==================== WORKOUT PLAN ROUTES ====================

@api_router.post("/workouts")
async def create_workout(
    workout: WorkoutPlanCreate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    # Check trainer is assigned to member
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": workout.member_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Not assigned to this member")
    
    plan = WorkoutPlan(
        name=workout.name,
        member_id=workout.member_id,
        trainer_id=current_user.id,
        exercises=[e.dict() for e in workout.exercises],
        day_of_week=workout.day_of_week,
        notes=workout.notes
    )
    
    await db.workouts.insert_one(plan.dict())
    return plan.dict()

@api_router.get("/workouts/{member_id}")
async def get_workouts(member_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Check access
    if current_user.role == "member" and current_user.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": member_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Not assigned to this member")
    
    workouts = await db.workouts.find({"member_id": member_id}).to_list(100)
    return [sanitize_mongo_doc(w) for w in workouts]

@api_router.put("/workouts/{workout_id}/complete")
async def complete_exercise(
    workout_id: str,
    exercise_index: int,
    current_user: UserInDB = Depends(get_current_user)
):
    workout = await db.workouts.find_one({"id": workout_id})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    if current_user.role == "member" and current_user.id != workout["member_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if exercise_index >= len(workout["exercises"]):
        raise HTTPException(status_code=400, detail="Invalid exercise index")
    
    await db.workouts.update_one(
        {"id": workout_id},
        {"$set": {f"exercises.{exercise_index}.completed": True}}
    )
    
    return {"message": "Exercise marked as completed"}

# ==================== DIET PLAN ROUTES ====================

@api_router.post("/diets")
async def create_diet(
    diet: DietPlanCreate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    # Check trainer is assigned to member
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": diet.member_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Not assigned to this member")
    
    plan = DietPlan(
        name=diet.name,
        member_id=diet.member_id,
        trainer_id=current_user.id,
        meals=[m.dict() for m in diet.meals],
        pdf_content=diet.pdf_content,
        notes=diet.notes
    )
    
    await db.diets.insert_one(plan.dict())
    return plan.dict()

@api_router.get("/diets/{member_id}")
async def get_diets(member_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Check access
    if current_user.role == "member" and current_user.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == "trainer":
        profile = await db.member_profiles.find_one({"user_id": member_id})
        if not profile or current_user.id not in profile.get("assigned_trainers", []):
            raise HTTPException(status_code=403, detail="Not assigned to this member")
    
    diets = await db.diets.find({"member_id": member_id}).to_list(100)
    return [sanitize_mongo_doc(d) for d in diets]

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/admin")
async def admin_dashboard(
    center: Optional[CenterType] = None,
    current_user: UserInDB = Depends(require_admin)
):
    member_query = {"role": "member"}
    if center:
        member_query["center"] = center
    
    total_members = await db.users.count_documents(member_query)
    active_members = await db.users.count_documents({**member_query, "is_active": True, "approval_status": "approved"})
    
    trainer_query = {"role": "trainer", "is_active": True, "approval_status": "approved"}
    if center:
        trainer_query["center"] = center
    total_trainers = await db.users.count_documents(trainer_query)
    
    # Today's attendance
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    attendance_query = {"check_in_time": {"$gte": today_start}}
    if center:
        attendance_query["center"] = center
    today_attendance = await db.attendance.count_documents(attendance_query)
    
    # This month's revenue (only for admins)
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    payment_query = {"payment_date": {"$gte": month_start}, "status": "completed"}
    if center:
        payment_query["center"] = center
    payments = await db.payments.find(payment_query).to_list(1000)
    monthly_revenue = sum(p["amount"] for p in payments)
    
    # Expiring memberships (next 7 days)
    next_week = datetime.utcnow() + timedelta(days=7)
    expiring = await db.member_profiles.count_documents({
        "membership.end_date": {"$lte": next_week, "$gte": datetime.utcnow()}
    })
    
    # Pending approvals
    pending_approvals = await db.approval_requests.count_documents({"status": "pending"})
    
    # Pending merchandise orders
    pending_orders = await db.merchandise_orders.count_documents({"status": "pending"})
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "total_trainers": total_trainers,
        "today_attendance": today_attendance,
        "monthly_revenue": monthly_revenue,
        "expiring_memberships": expiring,
        "pending_approvals": pending_approvals,
        "pending_orders": pending_orders,
        "centers": GYM_CENTERS
    }

@api_router.get("/dashboard/trainer")
async def trainer_dashboard(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "trainer":
        raise HTTPException(status_code=403, detail="Trainer access required")
    
    # Count assigned members
    assigned_members = await db.member_profiles.count_documents({"assigned_trainers": current_user.id})
    
    # Today's attendance for assigned members
    profiles = await db.member_profiles.find({"assigned_trainers": current_user.id}).to_list(1000)
    user_ids = [p["user_id"] for p in profiles]
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_attendance = await db.attendance.count_documents({
        "user_id": {"$in": user_ids},
        "check_in_time": {"$gte": today_start}
    })
    
    # Pending messages
    unread_messages = await db.messages.count_documents({
        "receiver_id": current_user.id,
        "read": False
    })
    
    # Pending member approvals at this center
    pending_approvals = await db.approval_requests.count_documents({
        "status": "pending",
        "user_role": "member",
        "center": current_user.center
    })
    
    return {
        "assigned_members": assigned_members,
        "today_attendance": today_attendance,
        "unread_messages": unread_messages,
        "pending_approvals": pending_approvals,
        "center": current_user.center
    }

@api_router.get("/dashboard/member")
async def member_dashboard(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Member access required")
    
    profile = await db.member_profiles.find_one({"user_id": current_user.id})
    
    # Membership status
    membership_valid = False
    days_remaining = 0
    payment_due = False
    if profile and profile.get("membership"):
        end_date = profile["membership"].get("end_date")
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            days_remaining = (end_date - datetime.utcnow()).days
            membership_valid = days_remaining > 0
        
        payment_status = profile["membership"].get("payment_status")
        payment_due = payment_status in ["pending", "overdue"]
    
    # This month's attendance
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    attendance_count = await db.attendance.count_documents({
        "user_id": current_user.id,
        "check_in_time": {"$gte": month_start}
    })
    
    # Today's workout
    today_day = datetime.utcnow().strftime("%A")
    today_workout = await db.workouts.find_one({
        "member_id": current_user.id,
        "day_of_week": today_day
    })
    
    # Unread messages
    unread_messages = await db.messages.count_documents({
        "receiver_id": current_user.id,
        "read": False
    })
    
    # Unread notifications
    unread_notifications = await db.notifications.count_documents({
        "user_id": current_user.id,
        "read": False
    })
    
    return {
        "membership_valid": membership_valid,
        "days_remaining": max(0, days_remaining),
        "payment_due": payment_due,
        "attendance_this_month": attendance_count,
        "has_today_workout": today_workout is not None,
        "unread_messages": unread_messages,
        "unread_notifications": unread_notifications,
        "member_id": profile["member_id"] if profile else None,
        "center": current_user.center,
        "approval_status": current_user.approval_status
    }

@api_router.get("/centers")
async def get_centers():
    return {"centers": GYM_CENTERS}

# ==================== SOCKET.IO EVENTS ====================

connected_users = {}

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    user_id = None
    for uid, s in connected_users.items():
        if s == sid:
            user_id = uid
            break
    if user_id:
        del connected_users[user_id]
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def register(sid, data):
    user_id = data.get("user_id")
    if user_id:
        connected_users[user_id] = sid
        logger.info(f"User {user_id} registered with socket {sid}")

@sio.event
async def typing(sid, data):
    receiver_id = data.get("receiver_id")
    sender_id = data.get("sender_id")
    if receiver_id in connected_users:
        await sio.emit(f"typing_{receiver_id}", {"sender_id": sender_id})

# ==================== ROOT AND HEALTH ====================

@api_router.get("/")
async def root():
    return {"message": "Hercules Gym Management API", "version": "2.0.0", "centers": GYM_CENTERS}

@api_router.get("/health")
async def health():
    db_status = "ok"
    try:
        await db.command("ping")
    except Exception as exc:
        db_status = "error"
        logger.error(f"Health check database ping failed: {exc}")

    status_value = "healthy" if db_status == "ok" else "degraded"
    return {
        "status": status_value,
        "database": db_status,
        "environment": APP_ENV,
        "version": "2.0.0",
    }

# Include router
app.include_router(api_router)

# CORS middleware
cors_origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
if cors_origins_env == "*":
    cors_allow_origins = ["*"]
    cors_allow_credentials = False
else:
    cors_allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    cors_allow_credentials = True

if IS_PRODUCTION and cors_origins_env == "*":
    logger.warning("CORS_ORIGINS is set to '*'. Restrict this in production.")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=cors_allow_credentials,
    allow_origins=cors_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        await db.command("ping")
        logger.info(f"Connected to MongoDB database '{db_name}'")
    except Exception as exc:
        logger.error(f"Failed to connect to MongoDB during startup: {exc}")
        raise RuntimeError("MongoDB connection failed at startup.") from exc

    # Start payment reminder background task
    asyncio.create_task(check_payment_reminders())
    logger.info("Payment reminder background task started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export socket app for uvicorn
app = socket_app
