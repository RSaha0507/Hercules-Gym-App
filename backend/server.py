from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse, HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Tuple, Callable, Awaitable, TypeVar
import uuid
from datetime import datetime, timedelta, timezone, time, date as date_cls
from calendar import monthrange
import secrets
from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
import socketio
from bson import ObjectId
import httpx
import asyncio
import json
import math
from email_validator import validate_email, EmailNotValidError
from pymongo.errors import AutoReconnect, ConnectionFailure, NetworkTimeout, ServerSelectionTimeoutError, PyMongoError
import re
from urllib.parse import urlencode, urlparse, parse_qs

T = TypeVar("T")

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

def read_bool_env(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}

def read_float_env(name: str, default: float) -> float:
    value = os.environ.get(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


async def run_with_mongo_retry(
    operation: Callable[[], Awaitable[T]],
    *,
    context: str,
    attempts: int = 3,
    base_delay_seconds: float = 0.35,
) -> T:
    last_error: Optional[Exception] = None
    for attempt in range(1, attempts + 1):
        try:
            return await operation()
        except RETRYABLE_MONGO_EXCEPTIONS as exc:
            last_error = exc
            logger.warning(
                "Transient MongoDB error during %s (attempt %s/%s): %s",
                context,
                attempt,
                attempts,
                exc,
            )
            if attempt == attempts:
                break
            await asyncio.sleep(base_delay_seconds * attempt)
    raise HTTPException(
        status_code=503,
        detail="Service is warming up. Please retry in a few seconds.",
    ) from last_error


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
INDIA_PHONE_PREFIX = "+91"
ATTENDANCE_MAX_ACTIVE_HOURS = max(1, read_int_env("ATTENDANCE_MAX_ACTIVE_HOURS", 2))
ATTENDANCE_HISTORY_MONTHS_LIMIT = 5
ATTENDANCE_RETENTION_DAYS = max(150, read_int_env("ATTENDANCE_RETENTION_DAYS", 180))
ATTENDANCE_ENFORCE_QR_CHECKOUT = read_bool_env("ATTENDANCE_ENFORCE_QR_CHECKOUT", False)
ATTENDANCE_RECHECKIN_COOLDOWN_HOURS = max(0, read_int_env("ATTENDANCE_RECHECKIN_COOLDOWN_HOURS", 5))
ATTENDANCE_QR_GEOFENCE_METERS = max(50.0, read_float_env("ATTENDANCE_QR_GEOFENCE_METERS", 180.0))
ATTENDANCE_QR_MAX_GPS_ACCURACY_METERS = max(30.0, read_float_env("ATTENDANCE_QR_MAX_GPS_ACCURACY_METERS", 250.0))
ATTENDANCE_QR_BLOCK_MOCK_LOCATION = read_bool_env("ATTENDANCE_QR_BLOCK_MOCK_LOCATION", True)
PASSWORD_RESET_OTP_LENGTH = min(8, max(4, read_int_env("PASSWORD_RESET_OTP_LENGTH", 6)))
PASSWORD_RESET_OTP_TTL_MINUTES = max(1, read_int_env("PASSWORD_RESET_OTP_TTL_MINUTES", 10))
PASSWORD_RESET_OTP_RESEND_SECONDS = max(10, read_int_env("PASSWORD_RESET_OTP_RESEND_SECONDS", 45))
PASSWORD_RESET_OTP_MAX_ATTEMPTS = max(1, read_int_env("PASSWORD_RESET_OTP_MAX_ATTEMPTS", 5))
MEMBERSHIP_BASE_FEE = max(0.0, read_float_env("MEMBERSHIP_BASE_FEE", 700.0))
MEMBERSHIP_WINDOW_DAYS = max(1, read_int_env("MEMBERSHIP_WINDOW_DAYS", 7))
MEMBERSHIP_LATE_FEE_PER_DAY = max(0.0, read_float_env("MEMBERSHIP_LATE_FEE_PER_DAY", 5.0))
ACHIEVEMENT_ANNOUNCEMENT_DAYS = max(1, read_int_env("ACHIEVEMENT_ANNOUNCEMENT_DAYS", 5))
PAYMENT_PROOF_MAX_LENGTH = max(200000, read_int_env("PAYMENT_PROOF_MAX_LENGTH", 900000))
PROFILE_IMAGE_MAX_LENGTH = max(150000, read_int_env("PROFILE_IMAGE_MAX_LENGTH", 500000))
INDIA_TIMEZONE = timezone(timedelta(hours=5, minutes=30))
APP_SETTING_HERO_GALLERY_KEY = "hero_gallery"
APP_SETTING_ATTENDANCE_QR_KEY = "attendance_qr"
PASSWORD_MIN_LENGTH = max(8, read_int_env("PASSWORD_MIN_LENGTH", 8))
HERO_IMAGE_URI_MAX_LENGTH = max(120000, read_int_env("HERO_IMAGE_URI_MAX_LENGTH", 650000))
ATTENDANCE_SHARED_QR_CODE = (os.environ.get("ATTENDANCE_SHARED_QR_CODE") or "").strip()


def _read_center_coordinate(center: str, coord_name: str, default: float) -> float:
    env_key = f"CENTER_{center.upper()}_{coord_name}"
    return read_float_env(env_key, default)


# Approximate center coordinates; override via env vars:
# CENTER_RANAGHAT_LAT/LNG, CENTER_CHAKDAH_LAT/LNG, CENTER_MADANPUR_LAT/LNG.
GYM_CENTER_COORDINATES: Dict[str, Tuple[float, float]] = {
    "Ranaghat": (
        _read_center_coordinate("RANAGHAT", "LAT", 23.1728),
        _read_center_coordinate("RANAGHAT", "LNG", 88.5664),
    ),
    "Chakdah": (
        _read_center_coordinate("CHAKDAH", "LAT", 23.0765),
        _read_center_coordinate("CHAKDAH", "LNG", 88.5370),
    ),
    "Madanpur": (
        _read_center_coordinate("MADANPUR", "LAT", 23.0086),
        _read_center_coordinate("MADANPUR", "LNG", 88.4863),
    ),
}

DEFAULT_HERO_GALLERY = [
    {
        "id": "hero-1",
        "title": "Strength Zone",
        "uri": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80",
    },
    {
        "id": "hero-2",
        "title": "Cardio Bay",
        "uri": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1400&q=80",
    },
    {
        "id": "hero-3",
        "title": "Functional Training",
        "uri": "https://images.unsplash.com/photo-1598971639058-a63a5f6b6f32?auto=format&fit=crop&w=1400&q=80",
    },
    {
        "id": "hero-4",
        "title": "Free Weight Arena",
        "uri": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80",
    },
    {
        "id": "hero-5",
        "title": "Athlete Corner",
        "uri": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1400&q=80",
    },
]

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

RETRYABLE_MONGO_EXCEPTIONS = (AutoReconnect, ConnectionFailure, NetworkTimeout, ServerSelectionTimeoutError)

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


@app.exception_handler(PyMongoError)
async def handle_mongo_errors(_: Request, exc: PyMongoError):
    logger.error(f"MongoDB operation failed: {exc}")
    return JSONResponse(
        status_code=503,
        content={"detail": "Service is temporarily unavailable. Please retry in a few seconds."},
    )

# ==================== MODELS ====================

RoleType = Literal["admin", "trainer", "member"]
ApprovalStatus = Literal["pending", "approved", "rejected"]

# User Models
class UserBase(BaseModel):
    email: str
    phone: str
    full_name: str
    role: RoleType
    center: Optional[CenterType] = None
    date_of_birth: Optional[datetime] = None

class UserCreate(UserBase):
    password: str
    profile_image: Optional[str] = None

class UserRegister(BaseModel):
    email: Optional[str] = None
    phone: str
    full_name: str
    password: str
    role: RoleType
    center: Optional[CenterType] = None
    date_of_birth: Optional[datetime] = None
    profile_image: Optional[str] = None

class UserLogin(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordOtpRequest(BaseModel):
    phone: str

class ForgotPasswordResetRequest(BaseModel):
    phone: str
    otp: str
    new_password: str
    confirm_password: str

class DataDeletionRequestCreate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    reason: Optional[str] = None

class DataDeletionRequestResolve(BaseModel):
    status: Literal["in_review", "completed", "rejected"] = "completed"
    note: Optional[str] = None

class SupportContactResponse(BaseModel):
    primary_admin_name: str
    primary_admin_phone: str
    primary_admin_email: str
    technical_support_phone: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True
    profile_image: Optional[str] = None
    is_primary_admin: bool = False
    approval_status: ApprovalStatus = "approved"
    push_token: Optional[str] = None
    achievements: List[str] = []

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    is_active: bool = True
    profile_image: Optional[str] = None
    is_primary_admin: bool = False
    approval_status: ApprovalStatus = "approved"
    push_token: Optional[str] = None
    achievements: List[str] = []

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    date_of_birth: Optional[datetime] = None

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

class BodyMetricsUpdate(BaseModel):
    date: Optional[datetime] = None
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
    payment_status: Literal["paid", "pending", "overdue", "paused"] = "pending"
    next_payment_date: Optional[datetime] = None
    last_reminder_sent: Optional[datetime] = None
    last_payment_date: Optional[datetime] = None
    billing_anchor_day: Optional[int] = None

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
    email: Optional[str] = None
    phone: str
    full_name: str
    password: str
    center: CenterType
    date_of_birth: Optional[datetime] = None
    profile_image: Optional[str] = None
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
    check_out_method: Optional[Literal["qr", "manual", "self", "auto_timeout"]] = None
    auto_checked_out: bool = False
    penalty_applied: bool = False
    penalty_reason: Optional[str] = None
    penalty_note: Optional[str] = None
    method: Literal["qr", "manual", "self"] = "manual"
    marked_by: Optional[str] = None

class AttendanceCreate(BaseModel):
    user_id: str
    method: Literal["qr", "manual", "self"] = "manual"

class QrScanRequest(BaseModel):
    code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy_m: Optional[float] = None
    is_mocked: Optional[bool] = None

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

class MessageDeleteRequest(BaseModel):
    message_ids: List[str]

# Notification Models
class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    body: str
    notification_type: Literal["approval", "payment", "merchandise", "announcement", "birthday", "general"] = "general"
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
    target: Literal["all", "members", "trainers", "selected", "center", "members_center"] = "all"
    target_center: Optional[CenterType] = None
    target_users: List[str] = []
    is_active: bool = True
    announcement_type: Literal["general", "achievement"] = "general"
    expires_at: Optional[datetime] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target: Literal["all", "members", "trainers", "selected", "center", "members_center"] = "all"
    target_center: Optional[CenterType] = None
    target_users: List[str] = []
    announcement_type: Literal["general", "achievement"] = "general"
    expires_at: Optional[datetime] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    target: Optional[Literal["all", "members", "trainers", "selected", "center", "members_center"]] = None
    target_center: Optional[CenterType] = None
    target_users: Optional[List[str]] = None
    announcement_type: Optional[Literal["general", "achievement"]] = None
    expires_at: Optional[datetime] = None

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
    payment_status: Literal["pending", "completed", "failed"] = "pending"
    payment_method: str = "upi"
    payment_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    notes: Optional[str] = None

class MerchandiseOrderCreate(BaseModel):
    items: List[CartItem]
    notes: Optional[str] = None
    payment_method: str = "upi"
    payment_proof_image: str

# Payment Models
class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    amount: float
    payment_type: Literal["membership", "merchandise"] = "membership"
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: str = "cash"
    description: str = ""
    status: Literal["pending", "completed", "failed"] = "completed"
    recorded_by: str
    center: CenterType
    base_amount: Optional[float] = None
    late_fee: float = 0
    payment_reference: Optional[str] = None
    membership_due_date: Optional[datetime] = None
    order_id: Optional[str] = None
    proof_image: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_note: Optional[str] = None

class PaymentCreate(BaseModel):
    member_id: str
    amount: float
    payment_type: Literal["membership", "merchandise"] = "membership"
    payment_method: str = "cash"
    description: str = ""
    status: Literal["pending", "completed", "failed"] = "completed"
    next_payment_date: Optional[datetime] = None
    order_id: Optional[str] = None

class MembershipPaymentRequest(BaseModel):
    payment_method: str = "upi"
    proof_image: str

class AchievementUpdate(BaseModel):
    achievements: List[str] = []

class PaymentVerificationRequest(BaseModel):
    status: Literal["completed", "failed"]
    note: Optional[str] = None

class HeroSlide(BaseModel):
    id: str
    title: str
    uri: str

class HeroGalleryUpdate(BaseModel):
    slides: List[HeroSlide] = Field(default_factory=list)

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

class WorkoutPlanUpdate(BaseModel):
    name: Optional[str] = None
    exercises: Optional[List[Exercise]] = None
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

class DietPlanUpdate(BaseModel):
    name: Optional[str] = None
    meals: Optional[List[Meal]] = None
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

def validate_password_strength(password: str) -> None:
    candidate = password or ""
    issues: List[str] = []

    if len(candidate) < PASSWORD_MIN_LENGTH:
        issues.append(f"at least {PASSWORD_MIN_LENGTH} characters")
    if re.search(r"\s", candidate):
        issues.append("no spaces")
    if not re.search(r"[A-Z]", candidate):
        issues.append("at least one uppercase letter")
    if not re.search(r"[a-z]", candidate):
        issues.append("at least one lowercase letter")
    if not re.search(r"\d", candidate):
        issues.append("at least one number")
    if not re.search(r"[^A-Za-z0-9]", candidate):
        issues.append("at least one special character")
    if len(set(candidate)) < 4:
        issues.append("more character variety")

    lowered = candidate.lower()
    common_patterns = ("password", "123456", "qwerty", "letmein", "admin", "hercules", "gym")
    if any(pattern in lowered for pattern in common_patterns):
        issues.append("avoid common words/patterns")

    if issues:
        raise HTTPException(
            status_code=400,
            detail=f"Weak password. Use: {', '.join(issues)}.",
        )

def normalize_and_validate_email(email: str) -> str:
    candidate = (email or "").strip().lower()
    if not candidate:
        raise HTTPException(status_code=400, detail="Email is required")
    try:
        validated = validate_email(candidate, check_deliverability=False)
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Invalid email format")
    return validated.normalized

def is_email_valid(email: str) -> bool:
    try:
        validate_email((email or "").strip(), check_deliverability=False)
        return True
    except EmailNotValidError:
        return False

def build_member_fallback_email(normalized_phone: str, full_name: str) -> str:
    digits = "".join(ch for ch in normalized_phone if ch.isdigit())
    suffix = digits[-10:] if len(digits) >= 10 else str(uuid.uuid4().int)[:10]
    raw_name = (full_name or "").strip().lower()
    local = "".join(ch if ch.isalnum() else "." for ch in raw_name)
    local = ".".join(part for part in local.split(".") if part)
    if not local:
        local = "member"
    local = local[:30]
    return f"{local}.{suffix}@member.herculesgym.app"

async def resolve_registration_email(
    email: Optional[str],
    normalized_phone: str,
    full_name: str,
    role: str,
) -> str:
    if email and str(email).strip():
        return normalize_and_validate_email(str(email))

    if role == "member":
        candidate = build_member_fallback_email(normalized_phone, full_name)
        # Rare conflict safety for deterministic fallback values.
        while await db.users.find_one({"email": candidate}):
            candidate = build_member_fallback_email(
                normalized_phone,
                f"{full_name}{uuid.uuid4().hex[:4]}",
            )
        logger.warning(
            "Legacy member registration compatibility mode used: auto-generated email for phone ending %s",
            normalized_phone[-4:],
        )
        return candidate

    raise HTTPException(status_code=400, detail="Email is required")

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
    
    user = await run_with_mongo_retry(
        lambda: db.users.find_one({"id": user_id}),
        context="auth.get_current_user.find_user",
    )
    if user is None:
        raise credentials_exception

    if not user.get("email"):
        user["email"] = ""
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

def normalize_payment_proof_image(value: Optional[str]) -> str:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Payment screenshot is required")
    if len(raw) > PAYMENT_PROOF_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Payment screenshot is too large")
    if not (raw.startswith("data:image/") or raw.startswith("http://") or raw.startswith("https://")):
        raise HTTPException(status_code=400, detail="Payment screenshot must be an image data URI or image URL")
    return raw

def normalize_profile_image(value: Optional[str], *, required: bool = False) -> Optional[str]:
    raw = (value or "").strip()
    if not raw:
        if required:
            raise HTTPException(status_code=400, detail="Profile photo is required")
        return None
    if len(raw) > PROFILE_IMAGE_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Profile photo is too large")
    if not (raw.startswith("data:image/") or raw.startswith("http://") or raw.startswith("https://")):
        raise HTTPException(status_code=400, detail="Profile photo must be an image data URI or image URL")
    return raw

def normalize_date_of_birth(value: Optional[object], *, strict: bool = True) -> Optional[datetime]:
    if value is None:
        return None

    parsed_date: Optional[date_cls] = None

    if isinstance(value, datetime):
        parsed_date = value.date() if value.tzinfo is None else value.astimezone(INDIA_TIMEZONE).date()
    elif isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                parsed_date = datetime.strptime(raw, fmt).date()
                break
            except ValueError:
                continue
        if parsed_date is None:
            try:
                parsed_dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                parsed_date = (
                    parsed_dt.date()
                    if parsed_dt.tzinfo is None
                    else parsed_dt.astimezone(INDIA_TIMEZONE).date()
                )
            except ValueError:
                if strict:
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid date_of_birth format. Use calendar date format.",
                    )
                return None
    else:
        if strict:
            raise HTTPException(status_code=400, detail="Invalid date_of_birth value")
        return None

    if parsed_date is None:
        return None

    today = datetime.now(INDIA_TIMEZONE).date()
    if parsed_date >= today:
        if strict:
            raise HTTPException(status_code=400, detail="Date of birth must be in the past")
        return None
    if parsed_date < date_cls(1900, 1, 1):
        if strict:
            raise HTTPException(status_code=400, detail="Date of birth is too old")
        return None

    return datetime(parsed_date.year, parsed_date.month, parsed_date.day)

def normalize_hero_gallery(raw_slides: Optional[List[dict]]) -> List[dict]:
    normalized: List[dict] = []
    source = raw_slides if isinstance(raw_slides, list) else []
    for idx, slide in enumerate(source):
        if not isinstance(slide, dict):
            continue
        uri = str(slide.get("uri") or "").strip()
        if not uri:
            continue
        if len(uri) > HERO_IMAGE_URI_MAX_LENGTH:
            raise HTTPException(status_code=400, detail="Hero image is too large")
        title = str(slide.get("title") or f"Slide {idx + 1}").strip()[:80]
        slide_id = str(slide.get("id") or f"hero-{idx + 1}").strip()[:60]
        normalized.append({
            "id": slide_id or f"hero-{idx + 1}",
            "title": title or f"Slide {idx + 1}",
            "uri": uri,
        })

    if not normalized:
        normalized = [dict(item) for item in DEFAULT_HERO_GALLERY]

    seen_ids = set()
    deduped: List[dict] = []
    for idx, slide in enumerate(normalized[:10]):
        candidate = slide.get("id") or f"hero-{idx + 1}"
        slide_id = candidate
        counter = 1
        while slide_id in seen_ids:
            counter += 1
            slide_id = f"{candidate}-{counter}"
        seen_ids.add(slide_id)
        deduped.append({
            "id": slide_id,
            "title": slide.get("title") or f"Slide {idx + 1}",
            "uri": slide.get("uri"),
        })
    return deduped

def coerce_utc_naive_datetime(value: Optional[object], fallback: Optional[datetime] = None) -> Optional[datetime]:
    if value is None:
        return fallback
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return fallback
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                return parsed
            return parsed.astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
            return fallback
    return fallback

def add_months_utc(base_dt: datetime, months: int = 1) -> datetime:
    total_months = (base_dt.month - 1) + months
    year = base_dt.year + (total_months // 12)
    month = (total_months % 12) + 1
    day = min(base_dt.day, monthrange(year, month)[1])
    return base_dt.replace(year=year, month=month, day=day)

def normalize_membership_plan(
    membership: Optional[Dict],
    *,
    reference_now: Optional[datetime] = None,
) -> Optional[Dict]:
    if not membership:
        return membership

    now = reference_now or datetime.utcnow()
    normalized = dict(membership)

    start_date = coerce_utc_naive_datetime(normalized.get("start_date"), now) or now
    end_date = coerce_utc_naive_datetime(normalized.get("end_date"), add_months_utc(start_date, 1))
    if end_date <= start_date:
        end_date = add_months_utc(start_date, 1)

    raw_anchor = normalized.get("billing_anchor_day")
    if raw_anchor is None:
        raw_anchor = start_date.day
    try:
        anchor_day = int(raw_anchor)
    except (TypeError, ValueError):
        anchor_day = start_date.day
    anchor_day = min(31, max(1, anchor_day))

    next_payment_date = coerce_utc_naive_datetime(normalized.get("next_payment_date"))
    if next_payment_date is None:
        first_due = add_months_utc(start_date, 1)
        next_payment_date = first_due.replace(day=min(anchor_day, monthrange(first_due.year, first_due.month)[1]))

    amount_value = normalized.get("amount")
    if amount_value is None:
        amount_value = MEMBERSHIP_BASE_FEE
    try:
        amount = float(amount_value)
    except (TypeError, ValueError):
        amount = MEMBERSHIP_BASE_FEE
    amount = max(0.0, amount)

    payment_status = normalized.get("payment_status")
    if payment_status not in {"paid", "pending", "overdue", "paused"}:
        payment_status = "pending"

    normalized["start_date"] = start_date
    normalized["end_date"] = end_date
    normalized["next_payment_date"] = next_payment_date
    normalized["billing_anchor_day"] = anchor_day
    normalized["amount"] = amount
    normalized["payment_status"] = payment_status
    normalized["last_reminder_sent"] = coerce_utc_naive_datetime(normalized.get("last_reminder_sent"))
    normalized["last_payment_date"] = coerce_utc_naive_datetime(normalized.get("last_payment_date"))

    return normalized

def build_default_membership_plan(
    joined_at: Optional[object] = None,
    *,
    reference_now: Optional[datetime] = None,
) -> Dict:
    now = coerce_utc_naive_datetime(reference_now, datetime.utcnow()) or datetime.utcnow()
    start_date = coerce_utc_naive_datetime(joined_at, now) or now
    if start_date > now:
        start_date = now

    anchor_day = min(31, max(1, start_date.day))
    first_due = add_months_utc(start_date, 1)
    next_due = first_due.replace(day=min(anchor_day, monthrange(first_due.year, first_due.month)[1]))

    base_plan = {
        "plan_name": "Monthly Membership",
        "start_date": start_date,
        "end_date": add_months_utc(start_date, 1),
        "amount": MEMBERSHIP_BASE_FEE,
        "is_active": True,
        "payment_status": "pending",
        "next_payment_date": next_due,
        "last_reminder_sent": None,
        "last_payment_date": None,
        "billing_anchor_day": anchor_day,
    }
    return normalize_membership_plan(base_plan, reference_now=now) or base_plan

def align_membership_with_join_date(
    membership: Optional[Dict],
    joined_at: Optional[object],
    *,
    reference_now: Optional[datetime] = None,
) -> Tuple[Optional[Dict], bool]:
    now = coerce_utc_naive_datetime(reference_now, datetime.utcnow()) or datetime.utcnow()
    normalized = normalize_membership_plan(membership, reference_now=now)
    if not normalized:
        return normalized, False

    joined = coerce_utc_naive_datetime(joined_at)
    if not joined:
        return normalized, False

    anchor_day = min(31, max(1, joined.day))
    min_due = add_months_utc(joined, 1)
    min_due = min_due.replace(day=min(anchor_day, monthrange(min_due.year, min_due.month)[1]))
    current_due = coerce_utc_naive_datetime(normalized.get("next_payment_date"), now) or min_due

    # Before completing month-1 from join date, payment cycle must not start.
    if now < min_due and current_due < min_due:
        normalized["start_date"] = joined
        normalized["end_date"] = add_months_utc(joined, 1)
        normalized["billing_anchor_day"] = anchor_day
        normalized["next_payment_date"] = min_due
        if normalized.get("payment_status") != "paused":
            normalized["payment_status"] = "pending"
        normalized["last_reminder_sent"] = None
        return normalized, True

    return normalized, False

def get_membership_due_details(
    membership: Optional[Dict],
    *,
    reference_now: Optional[datetime] = None,
) -> Optional[Dict]:
    if not membership:
        return None

    now = reference_now or datetime.utcnow()
    normalized = normalize_membership_plan(membership, reference_now=now)
    if not normalized:
        return None
    if normalized.get("payment_status") == "paused":
        return None

    due_date_dt = coerce_utc_naive_datetime(normalized.get("next_payment_date"), now) or now
    due_date = due_date_dt.date()
    today = now.date()
    days_from_due = (today - due_date).days
    days_until_due = max(0, -days_from_due)
    window_end = due_date + timedelta(days=MEMBERSHIP_WINDOW_DAYS - 1)

    late_days = 0
    if days_from_due >= MEMBERSHIP_WINDOW_DAYS:
        late_days = days_from_due - (MEMBERSHIP_WINDOW_DAYS - 1)

    base_amount = float(normalized.get("amount") or MEMBERSHIP_BASE_FEE)
    late_fee = round(late_days * MEMBERSHIP_LATE_FEE_PER_DAY, 2)
    total_amount = round(base_amount + late_fee, 2)
    reminder_active = days_from_due >= 0
    is_overdue = late_days > 0

    if is_overdue:
        payment_status = "overdue"
    elif reminder_active:
        payment_status = "pending"
    else:
        payment_status = "pending"

    return {
        "due_date": due_date_dt,
        "due_date_iso": due_date_dt.isoformat(),
        "window_end_date": datetime.combine(window_end, time.min),
        "window_end_date_iso": datetime.combine(window_end, time.min).isoformat(),
        "base_amount": round(base_amount, 2),
        "late_fee": late_fee,
        "total_amount": total_amount,
        "days_from_due": max(0, days_from_due),
        "days_until_due": days_until_due,
        "days_late": late_days,
        "reminder_active": reminder_active,
        "is_due_now": reminder_active,
        "is_overdue": is_overdue,
        "recommended_payment_status": payment_status,
    }

def build_membership_reminder_text(details: Dict) -> Tuple[str, str]:
    due_date_text = details["due_date"].strftime("%d %b %Y")
    if details.get("is_overdue"):
        late_fee_text = int(details["late_fee"]) if details["late_fee"].is_integer() else details["late_fee"]
        total_text = int(details["total_amount"]) if details["total_amount"].is_integer() else details["total_amount"]
        title = "Membership Payment Overdue"
        body = (
            f"Payment due date was {due_date_text}. Late fee now Rs.{late_fee_text}. "
            f"Total payable Rs.{total_text}. Please pay today."
        )
        return title, body

    if details.get("is_due_now"):
        remaining_days = max(0, MEMBERSHIP_WINDOW_DAYS - details.get("days_from_due", 0))
        base_text = int(details["base_amount"]) if details["base_amount"].is_integer() else details["base_amount"]
        title = "Membership Payment Reminder"
        body = (
            f"Monthly payment is due from {due_date_text}. Pay within {remaining_days} day(s) "
            f"to avoid late fee. Amount Rs.{base_text}."
        )
        return title, body

    title = "Upcoming Membership Payment"
    body = f"Your next membership payment is due on {due_date_text}."
    return title, body

def next_membership_due_date(current_due_date: datetime, anchor_day: int) -> datetime:
    next_due = add_months_utc(current_due_date, 1)
    aligned_day = min(anchor_day, monthrange(next_due.year, next_due.month)[1])
    return next_due.replace(day=aligned_day)

def reset_membership_cycle_from_reference(
    membership: Optional[Dict],
    *,
    reference_now: Optional[datetime] = None,
) -> Optional[Dict]:
    if not membership:
        return membership

    now = coerce_utc_naive_datetime(reference_now, datetime.utcnow()) or datetime.utcnow()
    normalized = normalize_membership_plan(membership, reference_now=now)
    if not normalized:
        return None

    anchor_day = min(31, max(1, now.day))
    first_due = add_months_utc(now, 1)
    next_due = first_due.replace(day=min(anchor_day, monthrange(first_due.year, first_due.month)[1]))

    normalized["start_date"] = now
    normalized["end_date"] = add_months_utc(now, 1)
    normalized["billing_anchor_day"] = anchor_day
    normalized["next_payment_date"] = next_due
    normalized["payment_status"] = "pending"
    normalized["last_payment_date"] = None
    normalized["last_reminder_sent"] = None
    normalized.pop("deactivated_at", None)
    return normalized

def _is_same_center(user_a: Dict, user_b: Dict) -> bool:
    return bool(user_a.get("center")) and user_a.get("center") == user_b.get("center")

def _is_user_active_and_approved(user_doc: Optional[Dict]) -> bool:
    if not user_doc:
        return False
    return user_doc.get("is_active", True) and user_doc.get("approval_status", "approved") == "approved"

async def get_active_trainer_ids_by_center(center: Optional[str]) -> List[str]:
    if not center:
        return []
    trainers = await db.users.find(
        {
            "role": "trainer",
            "center": center,
            "is_active": True,
            "approval_status": "approved",
        },
        {"id": 1},
    ).to_list(2000)
    return [trainer["id"] for trainer in trainers if trainer.get("id")]

async def sync_member_assignments_for_member(member_user_id: str):
    member_user = await db.users.find_one({"id": member_user_id, "role": "member"})
    if not member_user:
        return
    center = member_user.get("center")
    trainer_ids = await get_active_trainer_ids_by_center(center)
    await db.member_profiles.update_one(
        {"user_id": member_user_id},
        {"$set": {"assigned_trainers": trainer_ids}},
    )

async def sync_member_assignments_for_center(center: Optional[str]):
    if not center:
        return
    trainer_ids = await get_active_trainer_ids_by_center(center)
    members = await db.users.find({"role": "member", "center": center}, {"id": 1}).to_list(5000)
    for member in members:
        member_id = member.get("id")
        if not member_id:
            continue
        await db.member_profiles.update_one(
            {"user_id": member_id},
            {"$set": {"assigned_trainers": trainer_ids}},
        )

async def sync_all_branch_assignments():
    for center in GYM_CENTERS:
        await sync_member_assignments_for_center(center)

def normalize_indian_phone(phone: str) -> str:
    raw = (phone or "").strip()
    digits = "".join(ch for ch in raw if ch.isdigit())

    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]

    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Phone must be a 10-digit Indian mobile number")

    if digits[0] not in {"6", "7", "8", "9"}:
        raise HTTPException(status_code=400, detail="Phone must start with 6, 7, 8, or 9")

    return f"{INDIA_PHONE_PREFIX}{digits}"

def phone_lookup_values(normalized_phone: str) -> List[str]:
    digits = "".join(ch for ch in (normalized_phone or "") if ch.isdigit())
    ten_digits = digits[2:] if digits.startswith("91") and len(digits) >= 12 else digits[-10:]
    candidates = [normalized_phone]
    if ten_digits:
        candidates.extend([
            ten_digits,
            f"91{ten_digits}",
            f"{INDIA_PHONE_PREFIX}{ten_digits}",
        ])
    # Preserve order and remove duplicates.
    deduped: List[str] = []
    seen = set()
    for item in candidates:
        if item and item not in seen:
            seen.add(item)
            deduped.append(item)
    return deduped

async def can_users_chat(sender: Dict, receiver: Dict) -> Tuple[bool, str]:
    if sender.get("id") == receiver.get("id"):
        return False, "Cannot message yourself"
    if not _is_user_active_and_approved(sender) or not _is_user_active_and_approved(receiver):
        return False, "Chat unavailable for inactive/unapproved users"

    sender_role = sender.get("role")
    receiver_role = receiver.get("role")

    if sender_role == "member":
        if not _is_same_center(sender, receiver):
            return False, "Members can only message users from the same branch"
        if receiver_role in {"admin", "trainer", "member"}:
            return True, ""
        return False, "Unsupported receiver role"

    if sender_role == "trainer":
        if receiver_role == "member":
            if not _is_same_center(sender, receiver):
                return False, "Can only message members from your branch"
            return True, ""
        if receiver_role == "trainer":
            return (_is_same_center(sender, receiver), "Can only message trainers from your branch")
        if receiver_role == "admin":
            return True, ""
        return False, "Unsupported receiver role"

    if sender_role == "admin":
        if sender.get("is_primary_admin"):
            return True, ""
        if not sender.get("center"):
            # Branchless admins are treated as global admins.
            return True, ""
        if receiver_role == "admin" and receiver.get("is_primary_admin"):
            return True, ""
        if _is_same_center(sender, receiver):
            return True, ""
        return False, "Can only message users from your branch"

    return False, "Unsupported sender role"

async def ensure_member_management_access(member_id: str, current_user: UserInDB):
    member_user = await db.users.find_one({"id": member_id, "role": "member"})
    if not member_user:
        raise HTTPException(status_code=404, detail="Member not found")

    profile = await db.member_profiles.find_one({"user_id": member_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Member profile not found")

    if current_user.role == "trainer":
        if member_user.get("center") != current_user.center:
            raise HTTPException(status_code=403, detail="Can only manage members from your branch")
    elif current_user.role == "admin":
        if (
            not current_user.is_primary_admin
            and current_user.center
            and member_user.get("center") != current_user.center
        ):
            raise HTTPException(status_code=403, detail="Can only manage members from your branch")
    elif current_user.role == "member":
        if current_user.id != member_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    return member_user, profile

async def rebuild_conversation_state(user_a_id: str, user_b_id: str):
    participants = sorted([user_a_id, user_b_id])
    latest_messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": user_a_id, "receiver_id": user_b_id},
                {"sender_id": user_b_id, "receiver_id": user_a_id},
            ]
        }
    ).sort("created_at", -1).to_list(1)

    if not latest_messages:
        await db.conversations.delete_one({"participant_ids": participants})
        return

    latest = latest_messages[0]
    unread_for_a = await db.messages.count_documents(
        {"sender_id": user_b_id, "receiver_id": user_a_id, "read": False}
    )
    unread_for_b = await db.messages.count_documents(
        {"sender_id": user_a_id, "receiver_id": user_b_id, "read": False}
    )

    await db.conversations.update_one(
        {"participant_ids": participants},
        {
            "$set": {
                "participant_ids": participants,
                "last_message": latest.get("content", "")[:50],
                "last_message_time": latest.get("created_at"),
                f"unread_count.{user_a_id}": unread_for_a,
                f"unread_count.{user_b_id}": unread_for_b,
            }
        },
        upsert=True,
    )

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
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data
    )

    try:
        await db.notifications.insert_one(notification.dict())
    except Exception as exc:
        logger.error(f"Failed to persist notification for user {user_id}: {exc}")
        return

    try:
        user = await db.users.find_one({"id": user_id})
        if user and user.get("push_token"):
            await send_push_notification(user["push_token"], title, body, data)
    except Exception as exc:
        logger.error(f"Failed to send push notification for user {user_id}: {exc}")

    try:
        await sio.emit(f"notification_{user_id}", notification.dict())
    except Exception as exc:
        logger.error(f"Failed to emit socket notification for user {user_id}: {exc}")

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
    """Background task to send daily membership reminders for due/overdue cycles."""
    while True:
        try:
            now = datetime.utcnow()
            today = now.date()

            profiles = await db.member_profiles.find({"membership": {"$exists": True, "$ne": None}}).to_list(2000)

            for profile in profiles:
                membership = normalize_membership_plan(profile.get("membership"), reference_now=now)
                if not membership:
                    continue
                user = await db.users.find_one(
                    {"id": profile.get("user_id"), "role": "member"},
                    {"id": 1, "is_active": 1, "approval_status": 1, "created_at": 1},
                )
                if not _is_user_active_and_approved(user):
                    if membership.get("payment_status") != "paused":
                        membership["payment_status"] = "paused"
                        membership["last_reminder_sent"] = None
                        membership["deactivated_at"] = now
                        await db.member_profiles.update_one(
                            {"user_id": profile["user_id"]},
                            {"$set": {"membership": membership}},
                        )
                    continue
                if membership.get("payment_status") == "paused":
                    continue

                membership, aligned = align_membership_with_join_date(
                    membership,
                    user.get("created_at") if user else None,
                    reference_now=now,
                )
                if aligned:
                    await db.member_profiles.update_one(
                        {"user_id": profile["user_id"]},
                        {"$set": {"membership": membership}},
                    )

                details = get_membership_due_details(membership, reference_now=now)
                if not details:
                    continue

                if not details.get("reminder_active"):
                    if membership.get("payment_status") != "pending":
                        membership["payment_status"] = "pending"
                        await db.member_profiles.update_one(
                            {"user_id": profile["user_id"]},
                            {"$set": {"membership": membership}},
                        )
                    continue

                membership["payment_status"] = details["recommended_payment_status"]
                last_reminder = membership.get("last_reminder_sent")
                if last_reminder:
                    last_reminder_date = (
                        last_reminder.date()
                        if isinstance(last_reminder, datetime)
                        else coerce_utc_naive_datetime(last_reminder, now).date()
                    )
                    if last_reminder_date == today:
                        await db.member_profiles.update_one(
                            {"user_id": profile["user_id"]},
                            {"$set": {"membership": membership}},
                        )
                        continue

                title, body = build_membership_reminder_text(details)
                await send_notification_to_user(
                    user["id"],
                    title,
                    body,
                    "payment",
                    {
                        "member_id": profile.get("member_id"),
                        "due_date": details["due_date_iso"],
                        "total_amount": details["total_amount"],
                        "late_fee": details["late_fee"],
                        "days_late": details["days_late"],
                    },
                )

                membership["last_reminder_sent"] = now
                await db.member_profiles.update_one(
                    {"user_id": profile["user_id"]},
                    {"$set": {"membership": membership}},
                )

            await asyncio.sleep(3600)
        except Exception as e:
            logger.error(f"Payment reminder error: {e}")
            await asyncio.sleep(3600)

async def resolve_user_date_of_birth(user_doc: Dict) -> Optional[datetime]:
    normalized = normalize_date_of_birth(user_doc.get("date_of_birth"), strict=False)
    if normalized:
        return normalized

    if user_doc.get("role") != "member":
        return None

    profile = await db.member_profiles.find_one(
        {"user_id": user_doc.get("id")},
        {"date_of_birth": 1},
    )
    profile_dob = normalize_date_of_birth(
        profile.get("date_of_birth") if profile else None,
        strict=False,
    )
    if profile_dob:
        await db.users.update_one(
            {"id": user_doc.get("id")},
            {"$set": {"date_of_birth": profile_dob}},
        )
    return profile_dob

async def check_birthday_reminders():
    """Background task to send birthday notifications to users/admins/trainers."""
    while True:
        try:
            today_ist = datetime.now(INDIA_TIMEZONE).date()
            today_key = today_ist.isoformat()
            users = await db.users.find(
                {
                    "is_active": True,
                    "approval_status": "approved",
                }
            ).to_list(5000)

            for user in users:
                dob = await resolve_user_date_of_birth(user)
                if not dob:
                    continue
                if dob.month != today_ist.month or dob.day != today_ist.day:
                    continue
                if user.get("birthday_last_notified_on") == today_key:
                    continue

                user_id = user.get("id")
                full_name = user.get("full_name") or "Member"
                role = user.get("role") or "member"
                center = user.get("center")

                await send_notification_to_user(
                    user_id,
                    "Happy Birthday!",
                    f"Happy Birthday {full_name}! Wishing you a healthy and strong year ahead.",
                    "birthday",
                    {
                        "user_id": user_id,
                        "role": role,
                        "center": center,
                        "birthday_date": today_key,
                    },
                )

                center_text = f" ({center})" if center else ""
                await notify_all_admins(
                    "Birthday Reminder",
                    f"Today is {full_name}'s birthday ({role}){center_text}.",
                    "birthday",
                    {
                        "user_id": user_id,
                        "role": role,
                        "center": center,
                        "birthday_date": today_key,
                    },
                )

                if role == "member" and center:
                    await notify_center_trainers(
                        center,
                        "Member Birthday Reminder",
                        f"Today is {full_name}'s birthday.",
                        "birthday",
                        {
                            "user_id": user_id,
                            "center": center,
                            "birthday_date": today_key,
                        },
                    )

                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {"birthday_last_notified_on": today_key}},
                )

            await asyncio.sleep(3600)
        except Exception as exc:
            logger.error(f"Birthday reminder error: {exc}")
            await asyncio.sleep(3600)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserRegister, background_tasks: BackgroundTasks):
    if user.role in ["member", "trainer"] and not user.date_of_birth:
        raise HTTPException(status_code=400, detail="Date of birth is required")
    normalized_phone = normalize_indian_phone(user.phone)
    normalized_dob = normalize_date_of_birth(user.date_of_birth) if user.date_of_birth else None
    normalized_profile_image = normalize_profile_image(user.profile_image)
    resolved_email = await resolve_registration_email(
        user.email,
        normalized_phone,
        user.full_name,
        user.role,
    )

    # Check if user exists
    existing = await run_with_mongo_retry(
        lambda: db.users.find_one({"email": resolved_email}),
        context="auth.register.find_email",
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_phone = await run_with_mongo_retry(
        lambda: db.users.find_one({"phone": normalized_phone}),
        context="auth.register.find_phone",
    )
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    # Check if this is the first admin (becomes primary admin)
    is_first_admin = False
    if user.role == "admin":
        admin_count = await run_with_mongo_retry(
            lambda: db.users.count_documents({"role": "admin"}),
            context="auth.register.count_admins",
        )
        is_first_admin = admin_count == 0
    
    # Determine approval status
    approval_status = "approved" if is_first_admin else "pending"
    if user.role == "member":
        approval_status = "pending"  # Members need trainer approval
    
    # Validate center for trainers and members
    if user.role in ["trainer", "member"] and not user.center:
        raise HTTPException(status_code=400, detail="Center is required for trainers and members")
    
    # Create user
    validate_password_strength(user.password)
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_dict = {
        "id": user_id,
        "email": resolved_email,
        "phone": normalized_phone,
        "full_name": user.full_name,
        "role": user.role,
        "center": user.center,
        "date_of_birth": normalized_dob,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": normalized_profile_image,
        "is_primary_admin": is_first_admin,
        "approval_status": approval_status,
        "push_token": None,
        "achievements": [],
    }
    
    await run_with_mongo_retry(
        lambda: db.users.insert_one(user_dict),
        context="auth.register.insert_user",
    )
    
    # Create member profile if role is member
    if user.role == "member":
        member_id = await generate_member_id()
        profile = {
            "user_id": user_id,
            "member_id": member_id,
            "date_of_birth": normalized_dob,
            "assigned_trainers": [],
            "membership": build_default_membership_plan(user_dict["created_at"]),
            "body_metrics": [],
            "progress_photos": []
        }
        await run_with_mongo_retry(
            lambda: db.member_profiles.insert_one(profile),
            context="auth.register.insert_member_profile",
        )
        await sync_member_assignments_for_member(user_id)
    
    # Create approval request if not primary admin
    if approval_status == "pending":
        approval_request = ApprovalRequest(
            user_id=user_id,
            user_name=user.full_name,
            user_email=resolved_email,
            user_role=user.role,
            center=user.center
        )
        await run_with_mongo_retry(
            lambda: db.approval_requests.insert_one(approval_request.dict()),
            context="auth.register.insert_approval_request",
        )
        
        # Send notification
        if user.role in ["admin", "trainer"]:
            # Notify primary admin
            primary_admin = await run_with_mongo_retry(
                lambda: db.users.find_one({"is_primary_admin": True}),
                context="auth.register.find_primary_admin",
            )
            if primary_admin:
                background_tasks.add_task(
                    send_notification_to_user,
                    primary_admin["id"],
                    "New Approval Request",
                    f"{user.full_name} has requested to join as {user.role} at {user.center or 'HQ'}",
                    "approval",
                    {"request_id": approval_request.id, "user_id": user_id},
                )
        elif user.role == "member":
            # Notify trainers at that center
            background_tasks.add_task(
                notify_center_trainers,
                user.center,
                "New Member Registration",
                f"{user.full_name} has requested to join at {user.center}",
                "approval",
                {"request_id": approval_request.id, "user_id": user_id},
            )
            # Also notify all admins
            background_tasks.add_task(
                notify_all_admins,
                "New Member Registration",
                f"{user.full_name} has requested to join at {user.center}",
                "approval",
                {"request_id": approval_request.id, "user_id": user_id},
            )
    
    # Generate token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=resolved_email,
        phone=normalized_phone,
        full_name=user.full_name,
        role=user.role,
        center=user.center,
        date_of_birth=normalized_dob,
        created_at=user_dict["created_at"],
        is_active=True,
        profile_image=normalized_profile_image,
        is_primary_admin=is_first_admin,
        approval_status=approval_status,
        achievements=[],
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    raw_identifier = (credentials.identifier or credentials.email or credentials.phone or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    query = {}
    if "@" in raw_identifier:
        query["email"] = raw_identifier.lower()
    else:
        try:
            query["phone"] = normalize_indian_phone(raw_identifier)
        except HTTPException:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    user = await run_with_mongo_retry(
        lambda: db.users.find_one(query),
        context="auth.login.find_user",
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("email"):
        user["email"] = ""
    
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
        date_of_birth=normalize_date_of_birth(user.get("date_of_birth"), strict=False),
        created_at=user["created_at"],
        is_active=user.get("is_active", True),
        profile_image=user.get("profile_image"),
        is_primary_admin=user.get("is_primary_admin", False),
        approval_status=user.get("approval_status", "approved"),
        push_token=user.get("push_token"),
        achievements=user.get("achievements", []),
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
        date_of_birth=normalize_date_of_birth(current_user.date_of_birth, strict=False),
        created_at=current_user.created_at,
        is_active=current_user.is_active,
        profile_image=current_user.profile_image,
        is_primary_admin=current_user.is_primary_admin,
        approval_status=current_user.approval_status,
        push_token=current_user.push_token,
        achievements=current_user.achievements or [],
    )

@api_router.get("/support/contact", response_model=SupportContactResponse)
async def get_support_contact(current_user: UserInDB = Depends(get_current_user)):
    primary_admin_doc = await run_with_mongo_retry(
        lambda: db.users.find_one(
            {
                "role": "admin",
                "is_primary_admin": True,
            },
            {
                "full_name": 1,
                "phone": 1,
                "email": 1,
            },
        ),
        context="support.contact.find_primary_admin",
    )

    fallback_email = (os.environ.get("SUPPORT_FALLBACK_EMAIL") or "binod20may@gmail.com").strip()
    fallback_phone = (os.environ.get("SUPPORT_FALLBACK_PHONE") or "").strip()
    technical_support_phone = (os.environ.get("TECHNICAL_SUPPORT_PHONE") or "+91 8617422754").strip()

    if primary_admin_doc:
        return SupportContactResponse(
            primary_admin_name=(primary_admin_doc.get("full_name") or "Primary Admin").strip(),
            primary_admin_phone=(primary_admin_doc.get("phone") or fallback_phone).strip(),
            primary_admin_email=(primary_admin_doc.get("email") or fallback_email).strip(),
            technical_support_phone=technical_support_phone,
        )

    return SupportContactResponse(
        primary_admin_name="Binod Kumar Gond",
        primary_admin_phone=fallback_phone,
        primary_admin_email=fallback_email,
        technical_support_phone=technical_support_phone,
    )

@api_router.put("/auth/push-token")
async def update_push_token(push_token: str, current_user: UserInDB = Depends(get_current_user)):
    await db.users.update_one({"id": current_user.id}, {"$set": {"push_token": push_token}})
    return {"message": "Push token updated"}

@api_router.put("/auth/profile")
async def update_profile(
    payload: UserProfileUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    incoming = payload.model_dump(exclude_unset=True)
    update_data = {}
    if "full_name" in incoming:
        full_name = (incoming.get("full_name") or "").strip()
        if full_name:
            update_data["full_name"] = full_name
    if "phone" in incoming:
        phone = (incoming.get("phone") or "").strip()
        if phone:
            update_data["phone"] = normalize_indian_phone(phone)
    if "profile_image" in incoming:
        update_data["profile_image"] = normalize_profile_image(incoming.get("profile_image"))
    if "date_of_birth" in incoming:
        normalized_dob = normalize_date_of_birth(incoming.get("date_of_birth"))
        update_data["date_of_birth"] = normalized_dob
        if current_user.role == "member":
            await db.member_profiles.update_one(
                {"user_id": current_user.id},
                {"$set": {"date_of_birth": normalized_dob}},
                upsert=True,
            )
    
    if update_data:
        await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}

@api_router.put("/auth/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    user_doc = await run_with_mongo_retry(
        lambda: db.users.find_one({"id": current_user.id}),
        context="auth.change_password.find_user",
    )
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user_doc.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    validate_password_strength(payload.new_password)

    if verify_password(payload.new_password, user_doc.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    await run_with_mongo_retry(
        lambda: db.users.update_one(
            {"id": current_user.id},
            {
                "$set": {
                    "hashed_password": get_password_hash(payload.new_password),
                    "password_updated_at": datetime.utcnow(),
                }
            },
        ),
        context="auth.change_password.update_hash",
    )
    return {"message": "Password changed successfully"}

def generate_password_reset_otp() -> str:
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(PASSWORD_RESET_OTP_LENGTH))

def normalize_password_reset_otp(value: str) -> str:
    normalized = "".join(ch for ch in (value or "").strip() if ch.isdigit())
    if len(normalized) != PASSWORD_RESET_OTP_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"OTP must be {PASSWORD_RESET_OTP_LENGTH} digits",
        )
    return normalized

@api_router.post("/auth/forgot-password/request-otp")
async def request_forgotten_password_otp(payload: ForgotPasswordOtpRequest):
    normalized_phone = normalize_indian_phone(payload.phone)
    phone_candidates = phone_lookup_values(normalized_phone)
    user_doc = await run_with_mongo_retry(
        lambda: db.users.find_one(
            {"phone": {"$in": phone_candidates}},
            {"id": 1, "full_name": 1, "is_active": 1},
        ),
        context="auth.forgot_password.request_otp.find_user",
    )
    if not user_doc:
        raise HTTPException(status_code=404, detail="Account not found")
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=400, detail="Account is inactive")

    now = datetime.utcnow()
    existing_otp = await run_with_mongo_retry(
        lambda: db.password_reset_otps.find_one({"phone": normalized_phone}),
        context="auth.forgot_password.request_otp.find_existing",
    )
    if existing_otp:
        resend_after = coerce_utc_naive_datetime(existing_otp.get("resend_after"), now)
        if resend_after and resend_after > now:
            wait_seconds = max(1, int((resend_after - now).total_seconds()))
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait_seconds} seconds before requesting a new OTP",
            )

    otp = generate_password_reset_otp()
    expires_at = now + timedelta(minutes=PASSWORD_RESET_OTP_TTL_MINUTES)
    resend_after = now + timedelta(seconds=PASSWORD_RESET_OTP_RESEND_SECONDS)

    await run_with_mongo_retry(
        lambda: db.password_reset_otps.update_one(
            {"phone": normalized_phone},
            {
                "$set": {
                    "phone": normalized_phone,
                    "user_id": user_doc["id"],
                    "otp_hash": get_password_hash(otp),
                    "created_at": now,
                    "expires_at": expires_at,
                    "resend_after": resend_after,
                    "attempt_count": 0,
                    "used_at": None,
                }
            },
            upsert=True,
        ),
        context="auth.forgot_password.request_otp.upsert_otp",
    )

    full_name = user_doc.get("full_name") or "Member"
    await send_notification_to_user(
        user_doc["id"],
        "Password Reset OTP",
        f"Hi {full_name}, your OTP is {otp}. It expires in {PASSWORD_RESET_OTP_TTL_MINUTES} minutes.",
        "security",
        {
            "action": "forgot_password_otp",
            "phone": normalized_phone,
        },
    )

    response = {"message": "OTP sent successfully"}
    if not IS_PRODUCTION:
        response["otp"] = otp
    return response

@api_router.post("/auth/forgot-password/reset")
async def reset_forgotten_password(payload: ForgotPasswordResetRequest):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    normalized_phone = normalize_indian_phone(payload.phone)
    normalized_otp = normalize_password_reset_otp(payload.otp)
    now = datetime.utcnow()

    otp_record = await run_with_mongo_retry(
        lambda: db.password_reset_otps.find_one({"phone": normalized_phone}),
        context="auth.forgot_password.reset.find_otp",
    )
    if not otp_record:
        raise HTTPException(status_code=400, detail="Request OTP first")

    expires_at = coerce_utc_naive_datetime(otp_record.get("expires_at"), now)
    if not expires_at or expires_at <= now:
        await run_with_mongo_retry(
            lambda: db.password_reset_otps.delete_one({"phone": normalized_phone}),
            context="auth.forgot_password.reset.delete_expired_otp",
        )
        raise HTTPException(status_code=400, detail="OTP expired. Request a new OTP")

    attempt_count = int(otp_record.get("attempt_count") or 0)
    if attempt_count >= PASSWORD_RESET_OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Maximum OTP attempts reached. Request a new OTP")

    if not verify_password(normalized_otp, otp_record.get("otp_hash", "")):
        attempt_count += 1
        await run_with_mongo_retry(
            lambda: db.password_reset_otps.update_one(
                {"phone": normalized_phone},
                {"$set": {"attempt_count": attempt_count, "last_attempt_at": now}},
            ),
            context="auth.forgot_password.reset.increment_attempt",
        )

        if attempt_count >= PASSWORD_RESET_OTP_MAX_ATTEMPTS:
            raise HTTPException(status_code=400, detail="Maximum OTP attempts reached. Request a new OTP")

        remaining_attempts = PASSWORD_RESET_OTP_MAX_ATTEMPTS - attempt_count
        raise HTTPException(
            status_code=400,
            detail=f"Invalid OTP. {remaining_attempts} attempt(s) remaining",
        )

    user_doc = await run_with_mongo_retry(
        lambda: db.users.find_one({"phone": {"$in": phone_lookup_values(normalized_phone)}}),
        context="auth.forgot_password.reset.find_user",
    )
    if not user_doc:
        raise HTTPException(status_code=404, detail="Account not found")

    validate_password_strength(payload.new_password)
    if verify_password(payload.new_password, user_doc.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    await run_with_mongo_retry(
        lambda: db.users.update_one(
            {"id": user_doc["id"]},
            {
                "$set": {
                    "hashed_password": get_password_hash(payload.new_password),
                    "password_updated_at": now,
                }
            },
        ),
        context="auth.forgot_password.reset.update_hash",
    )
    await run_with_mongo_retry(
        lambda: db.password_reset_otps.delete_one({"phone": normalized_phone}),
        context="auth.forgot_password.reset.delete_otp",
    )
    return {"message": "Password reset successful"}

@api_router.post("/data-deletion/request")
async def request_data_deletion(payload: DataDeletionRequestCreate):
    email = (payload.email or "").strip()
    phone = (payload.phone or "").strip()
    full_name = (payload.full_name or "").strip()
    reason = (payload.reason or "").strip()

    if not email and not phone:
        raise HTTPException(status_code=400, detail="Provide at least email or phone")

    normalized_email: Optional[str] = None
    normalized_phone: Optional[str] = None

    if email:
        normalized_email = normalize_and_validate_email(email)
    if phone:
        normalized_phone = normalize_indian_phone(phone)

    if len(full_name) > 120:
        raise HTTPException(status_code=400, detail="Full name is too long")
    if len(reason) > 1500:
        raise HTTPException(status_code=400, detail="Reason is too long")

    user_query_clauses: List[Dict[str, object]] = []
    if normalized_email:
        user_query_clauses.append({"email": normalized_email})
    if normalized_phone:
        user_query_clauses.append({"phone": {"$in": phone_lookup_values(normalized_phone)}})

    linked_user = None
    if user_query_clauses:
        linked_user = await run_with_mongo_retry(
            lambda: db.users.find_one({"$or": user_query_clauses}, {"id": 1, "email": 1, "phone": 1, "full_name": 1}),
            context="data_deletion.request.find_user",
        )

    request_id = str(uuid.uuid4())
    now = datetime.utcnow()
    request_doc = {
        "id": request_id,
        "email": normalized_email,
        "phone": normalized_phone,
        "full_name": full_name or (linked_user.get("full_name") if linked_user else None),
        "reason": reason or None,
        "user_id": linked_user.get("id") if linked_user else None,
        "status": "pending",
        "requested_at": now,
        "source": "public_form",
        "resolved_at": None,
        "resolved_by": None,
        "resolution_note": None,
    }
    await run_with_mongo_retry(
        lambda: db.data_deletion_requests.insert_one(request_doc),
        context="data_deletion.request.insert",
    )

    admin_users = await run_with_mongo_retry(
        lambda: db.users.find(
            {"role": "admin", "is_active": True, "approval_status": "approved"},
            {"id": 1},
        ).to_list(200),
        context="data_deletion.request.find_admins",
    )
    for admin_doc in admin_users:
        admin_id = admin_doc.get("id")
        if not admin_id:
            continue
        await send_notification_to_user(
            admin_id,
            "Data deletion request received",
            "A user submitted a new account/data deletion request.",
            "general",
            {"request_id": request_id, "action": "data_deletion_request"},
        )

    return {
        "message": "Data deletion request submitted successfully",
        "request_id": request_id,
    }

@api_router.get("/data-deletion/requests")
async def get_data_deletion_requests(current_user: UserInDB = Depends(require_admin)):
    _ = current_user
    requests = await run_with_mongo_retry(
        lambda: db.data_deletion_requests.find({}).sort("requested_at", -1).to_list(1000),
        context="data_deletion.list",
    )
    return [sanitize_mongo_doc(item) for item in requests]

@api_router.put("/data-deletion/requests/{request_id}")
async def resolve_data_deletion_request(
    request_id: str,
    payload: DataDeletionRequestResolve,
    current_user: UserInDB = Depends(require_admin),
):
    existing = await run_with_mongo_retry(
        lambda: db.data_deletion_requests.find_one({"id": request_id}),
        context="data_deletion.resolve.find",
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Data deletion request not found")

    note = (payload.note or "").strip()
    if len(note) > 1500:
        raise HTTPException(status_code=400, detail="Resolution note is too long")

    now = datetime.utcnow()
    await run_with_mongo_retry(
        lambda: db.data_deletion_requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": payload.status,
                    "resolution_note": note or None,
                    "resolved_at": now,
                    "resolved_by": current_user.id,
                }
            },
        ),
        context="data_deletion.resolve.update",
    )
    return {"message": "Data deletion request updated successfully"}

# ==================== APPROVAL ROUTES ====================

def build_pending_approvals_query(current_user: UserInDB) -> Dict[str, object]:
    query: Dict[str, object] = {"status": "pending"}
    if current_user.role == "trainer":
        query["user_role"] = "member"
        query["center"] = current_user.center
    elif current_user.role == "admin" and not current_user.is_primary_admin:
        query["user_role"] = "member"
    return query

@api_router.get("/approvals/pending")
async def get_pending_approvals(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role == "member":
        raise HTTPException(status_code=403, detail="Access denied")

    query = build_pending_approvals_query(current_user)
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
        return {"message": f"Request already {request['status']}"}
    
    # Check permission
    if request["user_role"] in ["admin", "trainer"]:
        if not current_user.is_primary_admin:
            raise HTTPException(status_code=403, detail="Only primary admin can approve admins/trainers")
    elif request["user_role"] == "member":
        if current_user.role == "trainer" and current_user.center != request["center"]:
            raise HTTPException(status_code=403, detail="Can only approve members from your center")
    
    reviewed_at = datetime.utcnow()

    # Update approval request (idempotent/race-safe)
    update_result = await db.approval_requests.update_one(
        {"id": request_id, "status": "pending"},
        {"$set": {
            "status": "approved",
            "reviewed_by": current_user.id,
            "reviewed_at": reviewed_at
        }}
    )
    if update_result.modified_count == 0:
        latest = await db.approval_requests.find_one({"id": request_id})
        latest_status = latest.get("status") if latest else "processed"
        return {"message": f"Request already {latest_status}"}
    
    # Update user status
    await db.users.update_one(
        {"id": request["user_id"]},
        {"$set": {"approval_status": "approved", "updated_at": reviewed_at}}
    )

    if request["user_role"] == "member":
        profile = await db.member_profiles.find_one({"user_id": request["user_id"]}, {"membership": 1})
        membership = normalize_membership_plan(
            profile.get("membership") if profile else None,
            reference_now=reviewed_at,
        )
        if membership:
            membership = reset_membership_cycle_from_reference(membership, reference_now=reviewed_at) or membership
        else:
            membership = build_default_membership_plan(reviewed_at, reference_now=reviewed_at)

        await db.member_profiles.update_one(
            {"user_id": request["user_id"]},
            {"$set": {"membership": membership}},
            upsert=True,
        )
        await sync_member_assignments_for_member(request["user_id"])
    elif request["user_role"] == "trainer":
        await sync_member_assignments_for_center(request.get("center"))
    
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
        return {"message": f"Request already {request['status']}"}
    
    # Check permission
    if request["user_role"] in ["admin", "trainer"]:
        if not current_user.is_primary_admin:
            raise HTTPException(status_code=403, detail="Only primary admin can reject admins/trainers")
    elif request["user_role"] == "member":
        if current_user.role == "trainer" and current_user.center != request["center"]:
            raise HTTPException(status_code=403, detail="Can only reject members from your center")
    
    # Update approval request (idempotent/race-safe)
    update_result = await db.approval_requests.update_one(
        {"id": request_id, "status": "pending"},
        {"$set": {
            "status": "rejected",
            "reviewed_by": current_user.id,
            "reviewed_at": datetime.utcnow(),
            "rejection_reason": reason
        }}
    )
    if update_result.modified_count == 0:
        latest = await db.approval_requests.find_one({"id": request_id})
        latest_status = latest.get("status") if latest else "processed"
        return {"message": f"Request already {latest_status}"}
    
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
    if current_user.role == "trainer" and member.center != current_user.center:
        raise HTTPException(status_code=403, detail="Trainers can only create members in their branch")
    if not member.date_of_birth:
        raise HTTPException(status_code=400, detail="Date of birth is required")

    normalized_dob = normalize_date_of_birth(member.date_of_birth) if member.date_of_birth else None
    normalized_profile_image = normalize_profile_image(member.profile_image)
    normalized_phone = normalize_indian_phone(member.phone)
    normalized_email = await resolve_registration_email(
        member.email,
        normalized_phone,
        member.full_name,
        "member",
    )
    existing = await db.users.find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_phone = await db.users.find_one({"phone": normalized_phone})
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    # Create user account
    validate_password_strength(member.password)
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(member.password)
    
    user_dict = {
        "id": user_id,
        "email": normalized_email,
        "phone": normalized_phone,
        "full_name": member.full_name,
        "role": "member",
        "center": member.center,
        "date_of_birth": normalized_dob,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": normalized_profile_image,
        "is_primary_admin": False,
        "approval_status": "approved",  # Created by admin/trainer, so pre-approved
        "push_token": None,
        "achievements": [],
    }
    await db.users.insert_one(user_dict)
    
    # Create member profile
    member_id = await generate_member_id()
    profile = {
        "user_id": user_id,
        "member_id": member_id,
        "date_of_birth": normalized_dob,
        "gender": member.gender,
        "address": member.address,
        "emergency_contact": member.emergency_contact.dict() if member.emergency_contact else None,
        "assigned_trainers": [],
        "membership": normalize_membership_plan(
            (member.membership.model_dump() if hasattr(member.membership, "model_dump") else member.membership.dict())
            if member.membership
            else build_default_membership_plan(user_dict["created_at"])
        ),
        "body_metrics": [],
        "medical_notes": member.medical_notes,
        "goals": member.goals,
        "progress_photos": []
    }
    await db.member_profiles.insert_one(profile)
    await sync_member_assignments_for_member(user_id)
    
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
        # Trainer sees all members at their center
        members = await db.users.find({"role": "member", "center": current_user.center}).to_list(1000)
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    member_ids = [member["id"] for member in members]
    profiles = []
    if member_ids:
        profiles = await db.member_profiles.find({"user_id": {"$in": member_ids}}).to_list(1000)
    profile_by_user_id = {profile["user_id"]: profile for profile in profiles}

    result = []
    for member in members:
        profile = profile_by_user_id.get(member["id"])
        member_dob = normalize_date_of_birth(member.get("date_of_birth"), strict=False) or normalize_date_of_birth(
            profile.get("date_of_birth") if profile else None,
            strict=False,
        )
        result.append({
            "id": member["id"],
            "email": member["email"],
            "phone": member["phone"],
            "full_name": member["full_name"],
            "is_active": member.get("is_active", True),
            "created_at": member["created_at"],
            "profile_image": member.get("profile_image"),
            "date_of_birth": member_dob,
            "center": member.get("center"),
            "member_id": profile["member_id"] if profile else None,
            "membership": profile.get("membership") if profile else None,
            "approval_status": member.get("approval_status", "approved"),
            "achievements": member.get("achievements", []),
        })
    
    return result

@api_router.get("/members/{user_id}")
async def get_member(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Check access
    if current_user.role == "member" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == "trainer":
        member_user = await db.users.find_one({"id": user_id, "role": "member"})
        if not member_user or member_user.get("center") != current_user.center:
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
            "date_of_birth": normalize_date_of_birth(user.get("date_of_birth"), strict=False) or normalize_date_of_birth(
                profile.get("date_of_birth") if profile else None,
                strict=False,
            ),
            "center": user.get("center"),
            "role": user.get("role"),
            "achievements": user.get("achievements", []),
        },
        "profile": sanitize_mongo_doc(profile)
    }

@api_router.put("/members/{user_id}")
async def update_member(
    user_id: str,
    update: MemberProfileUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    existing_member = await db.users.find_one({"id": user_id, "role": "member"})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
    old_center = existing_member.get("center")

    # Check access
    if current_user.role == "member":
        if current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Members can only update certain fields
        allowed_fields = ["full_name", "phone", "address", "emergency_contact", "goals"]
        update_dict = {k: v for k, v in update.dict(exclude_unset=True).items() if k in allowed_fields}
    elif current_user.role == "trainer":
        member_user = await db.users.find_one({"id": user_id, "role": "member"})
        if not member_user or member_user.get("center") != current_user.center:
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
        user_fields["phone"] = normalize_indian_phone(update_dict.pop("phone"))
    if "center" in update_dict:
        user_fields["center"] = update_dict.pop("center")
    if "date_of_birth" in update_dict:
        raw_dob = update_dict.get("date_of_birth")
        normalized_dob = normalize_date_of_birth(raw_dob) if raw_dob else None
        update_dict["date_of_birth"] = normalized_dob
        user_fields["date_of_birth"] = normalized_dob
    
    if user_fields:
        await db.users.update_one({"id": user_id}, {"$set": user_fields})
    
    # Update profile fields
    if update_dict:
        if "emergency_contact" in update_dict and update_dict["emergency_contact"]:
            update_dict["emergency_contact"] = update_dict["emergency_contact"].dict() if hasattr(update_dict["emergency_contact"], 'dict') else update_dict["emergency_contact"]
        if "membership" in update_dict and update_dict["membership"]:
            raw_membership = update_dict["membership"].dict() if hasattr(update_dict["membership"], 'dict') else update_dict["membership"]
            update_dict["membership"] = normalize_membership_plan(raw_membership)
        await db.member_profiles.update_one({"user_id": user_id}, {"$set": update_dict})

    if "center" in user_fields:
        await sync_member_assignments_for_member(user_id)
        if old_center and old_center != user_fields["center"]:
            await sync_member_assignments_for_center(old_center)
    
    return {"message": "Member updated successfully"}

@api_router.delete("/members/{user_id}")
async def delete_member(user_id: str, current_user: UserInDB = Depends(require_admin)):
    existing_member = await db.users.find_one({"id": user_id, "role": "member"})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")

    deleted = {
        "users": 0,
        "member_profiles": 0,
        "attendance": 0,
        "workouts": 0,
        "diets": 0,
        "payments": 0,
        "messages": 0,
        "conversations": 0,
        "notifications": 0,
        "approval_requests": 0,
    }

    deleted["member_profiles"] = (await db.member_profiles.delete_many({"user_id": user_id})).deleted_count
    deleted["attendance"] = (await db.attendance.delete_many({"user_id": user_id})).deleted_count
    deleted["workouts"] = (await db.workouts.delete_many({"member_id": user_id})).deleted_count
    deleted["diets"] = (await db.diets.delete_many({"member_id": user_id})).deleted_count
    deleted["payments"] = (await db.payments.delete_many({"member_id": user_id})).deleted_count
    deleted["messages"] = (
        await db.messages.delete_many({"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]})
    ).deleted_count
    deleted["conversations"] = (await db.conversations.delete_many({"participant_ids": user_id})).deleted_count
    deleted["notifications"] = (await db.notifications.delete_many({"user_id": user_id})).deleted_count
    deleted["approval_requests"] = (await db.approval_requests.delete_many({"user_id": user_id})).deleted_count
    deleted["users"] = (await db.users.delete_many({"id": user_id, "role": "member"})).deleted_count

    await sync_member_assignments_for_center(existing_member.get("center"))
    return {"message": "Member deleted permanently", "deleted_records": deleted}

@api_router.put("/members/{user_id}/deactivate")
async def deactivate_member(user_id: str, current_user: UserInDB = Depends(require_admin)):
    existing_member = await db.users.find_one({"id": user_id, "role": "member"})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")

    now = datetime.utcnow()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "updated_at": now}},
    )

    profile = await db.member_profiles.find_one({"user_id": user_id}, {"membership": 1})
    if profile and profile.get("membership"):
        membership = normalize_membership_plan(profile.get("membership"), reference_now=now)
        if membership:
            membership["payment_status"] = "paused"
            membership["last_reminder_sent"] = None
            membership["deactivated_at"] = now
            await db.member_profiles.update_one(
                {"user_id": user_id},
                {"$set": {"membership": membership}},
            )

    return {"message": "Member deactivated successfully"}

@api_router.put("/members/{user_id}/activate")
async def activate_member(user_id: str, current_user: UserInDB = Depends(require_admin)):
    existing_member = await db.users.find_one({"id": user_id, "role": "member"})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")

    now = datetime.utcnow()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": True, "updated_at": now}},
    )

    next_due_date = None
    profile = await db.member_profiles.find_one({"user_id": user_id}, {"membership": 1})
    if profile and profile.get("membership"):
        membership = reset_membership_cycle_from_reference(profile.get("membership"), reference_now=now)
        if membership:
            next_due_date = membership.get("next_payment_date")
            await db.member_profiles.update_one(
                {"user_id": user_id},
                {"$set": {"membership": membership}},
            )

    await sync_member_assignments_for_member(user_id)
    return {
        "message": "Member activated successfully",
        "next_payment_date": next_due_date.isoformat() if isinstance(next_due_date, datetime) else None,
    }

@api_router.put("/members/{user_id}/center")
async def change_member_center(
    user_id: str,
    new_center: CenterType,
    current_user: UserInDB = Depends(require_admin)
):
    """Admin only - change member's center"""
    existing_member = await db.users.find_one({"id": user_id, "role": "member"})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
    old_center = existing_member.get("center")
    await db.users.update_one({"id": user_id}, {"$set": {"center": new_center}})
    await sync_member_assignments_for_member(user_id)
    if old_center and old_center != new_center:
        await sync_member_assignments_for_center(old_center)
    return {"message": f"Member center changed to {new_center}"}

@api_router.post("/members/{user_id}/metrics")
async def add_body_metrics(
    user_id: str,
    metrics: BodyMetrics,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    await ensure_member_management_access(user_id, current_user)

    await db.member_profiles.update_one(
        {"user_id": user_id},
        {"$push": {"body_metrics": metrics.dict()}}
    )
    
    return {"message": "Metrics added successfully"}

@api_router.put("/members/{user_id}/metrics/{metric_index}")
async def update_body_metrics(
    user_id: str,
    metric_index: int,
    metrics: BodyMetricsUpdate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    _, profile = await ensure_member_management_access(user_id, current_user)

    metric_updates = metrics.model_dump(exclude_unset=True)
    if not metric_updates:
        return {"message": "No metric changes provided"}

    metric_list = profile.get("body_metrics", [])
    if metric_index < 0 or metric_index >= len(metric_list):
        raise HTTPException(status_code=404, detail="Metric entry not found")

    updated_metric = {**metric_list[metric_index], **metric_updates}
    metric_list[metric_index] = updated_metric

    await db.member_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"body_metrics": metric_list}}
    )

    return {"message": "Metrics updated successfully", "metric": updated_metric}

@api_router.delete("/members/{user_id}/metrics/{metric_index}")
async def delete_body_metrics(
    user_id: str,
    metric_index: int,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    _, profile = await ensure_member_management_access(user_id, current_user)

    metric_list = profile.get("body_metrics", [])
    if metric_index < 0 or metric_index >= len(metric_list):
        raise HTTPException(status_code=404, detail="Metric entry not found")

    removed_metric = metric_list.pop(metric_index)
    await db.member_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"body_metrics": metric_list}}
    )

    return {"message": "Metrics deleted successfully", "metric": removed_metric}

# ==================== TRAINER MANAGEMENT ROUTES ====================

@api_router.post("/trainers")
async def create_trainer(user: UserCreate, current_user: UserInDB = Depends(require_primary_admin)):
    if user.role != "trainer":
        raise HTTPException(status_code=400, detail="Role must be trainer")
    
    if not user.center:
        raise HTTPException(status_code=400, detail="Center is required for trainers")
    if not user.date_of_birth:
        raise HTTPException(status_code=400, detail="Date of birth is required")
    
    normalized_email = normalize_and_validate_email(str(user.email))
    existing = await db.users.find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    normalized_phone = normalize_indian_phone(user.phone)
    existing_phone = await db.users.find_one({"phone": normalized_phone})
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone already registered")
    
    normalized_dob = normalize_date_of_birth(user.date_of_birth) if user.date_of_birth else None
    normalized_profile_image = normalize_profile_image(user.profile_image)
    validate_password_strength(user.password)
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_dict = {
        "id": user_id,
        "email": normalized_email,
        "phone": normalized_phone,
        "full_name": user.full_name,
        "role": "trainer",
        "center": user.center,
        "date_of_birth": normalized_dob,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "profile_image": normalized_profile_image,
        "is_primary_admin": False,
        "approval_status": "approved",  # Created by primary admin
        "push_token": None,
        "achievements": [],
    }
    await db.users.insert_one(user_dict)
    await sync_member_assignments_for_center(user.center)
    
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
    
    trainer_ids = [trainer["id"] for trainer in trainers]
    assigned_member_count_by_trainer = {}
    if trainer_ids:
        assigned_counts = await db.member_profiles.aggregate([
            {"$match": {"assigned_trainers": {"$in": trainer_ids}}},
            {"$unwind": "$assigned_trainers"},
            {"$match": {"assigned_trainers": {"$in": trainer_ids}}},
            {"$group": {"_id": "$assigned_trainers", "count": {"$sum": 1}}},
        ]).to_list(1000)
        assigned_member_count_by_trainer = {row["_id"]: row["count"] for row in assigned_counts}

    result = []
    for trainer in trainers:
        member_count = assigned_member_count_by_trainer.get(trainer["id"], 0)
        result.append({
            "id": trainer["id"],
            "email": trainer["email"],
            "phone": trainer["phone"],
            "full_name": trainer["full_name"],
            "profile_image": trainer.get("profile_image"),
            "date_of_birth": normalize_date_of_birth(trainer.get("date_of_birth"), strict=False),
            "center": trainer.get("center"),
            "member_count": member_count,
            "achievements": trainer.get("achievements", []),
        })
    
    return result

@api_router.get("/trainers/{user_id}")
async def get_trainer(user_id: str, current_user: UserInDB = Depends(get_current_user)):
    if current_user.role == "member":
        raise HTTPException(status_code=403, detail="Access denied")

    trainer = await db.users.find_one({"id": user_id, "role": "trainer", "is_active": True})
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    member_count = await db.member_profiles.count_documents({"assigned_trainers": user_id})

    return {
        "id": trainer["id"],
        "email": trainer["email"],
        "phone": trainer["phone"],
        "full_name": trainer["full_name"],
        "center": trainer.get("center"),
        "created_at": trainer.get("created_at"),
        "profile_image": trainer.get("profile_image"),
        "date_of_birth": normalize_date_of_birth(trainer.get("date_of_birth"), strict=False),
        "member_count": member_count,
        "achievements": trainer.get("achievements", []),
    }

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
    
    old_center = trainer.get("center")
    await db.users.update_one({"id": user_id}, {"$set": {"center": new_center}})
    if old_center:
        await sync_member_assignments_for_center(old_center)
    await sync_member_assignments_for_center(new_center)
    return {"message": f"Trainer center changed to {new_center}"}

@api_router.put("/users/{user_id}/achievements")
async def update_user_achievements(
    user_id: str,
    payload: AchievementUpdate,
    current_user: UserInDB = Depends(require_admin),
):
    user_doc = await db.users.find_one({"id": user_id, "role": {"$in": ["member", "trainer"]}})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    incoming = payload.achievements or []
    achievements = [item.strip() for item in incoming if isinstance(item, str) and item.strip()]
    # Keep payload bounded to avoid oversized documents from accidental paste.
    achievements = achievements[:50]
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"achievements": achievements, "updated_at": datetime.utcnow()}},
    )

    if achievements:
        top_items = ", ".join(achievements[:3])
        if len(achievements) > 3:
            top_items += ", and more"
        announcement = Announcement(
            title=f"Achievement Update: {user_doc['full_name']}",
            content=f"{user_doc['full_name']} achieved: {top_items}.",
            created_by=current_user.id,
            target="all",
            announcement_type="achievement",
            expires_at=datetime.utcnow() + timedelta(days=ACHIEVEMENT_ANNOUNCEMENT_DAYS),
        )
        await db.announcements.insert_one(announcement.dict())
        try:
            await sio.emit("announcement", announcement.dict())
        except Exception as exc:
            logger.error(f"Achievement announcement emit failed for {user_id}: {exc}")

    return {"message": "Achievements updated", "achievements": achievements, "user_id": user_id}

def get_day_start_utc(at: Optional[datetime] = None) -> datetime:
    ref = at or datetime.utcnow()
    return ref.replace(hour=0, minute=0, second=0, microsecond=0)

def to_utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)

def get_attendance_retention_cutoff(at: Optional[datetime] = None) -> datetime:
    return (at or datetime.utcnow()) - timedelta(days=ATTENDANCE_RETENTION_DAYS)

def build_attendance_qr_payload(code: str) -> str:
    query = urlencode({"code": code})
    return f"herculesgym://attendance?{query}"

def normalize_attendance_qr_input(raw_code: Optional[str]) -> str:
    value = (raw_code or "").strip()
    if not value:
        return ""

    if value.startswith("{") and value.endswith("}"):
        try:
            parsed_json = json.loads(value)
            candidate = str(parsed_json.get("code") or "").strip()
            if candidate:
                return candidate
        except Exception:
            pass

    try:
        parsed = urlparse(value)
        query = parse_qs(parsed.query or "")
        candidate = ""
        if query.get("code"):
            candidate = str(query["code"][0]).strip()
        elif parsed.path:
            candidate = parsed.path.strip().lstrip("/")
        if candidate:
            return candidate
    except Exception:
        pass

    return value

def to_float_or_none(value: Optional[object]) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_m = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_m * c

def resolve_center_coordinates(center: Optional[str]) -> Optional[Tuple[float, float]]:
    if not center:
        return None
    return GYM_CENTER_COORDINATES.get(center)

def resolve_qr_scan_payload(
    payload: Optional[QrScanRequest],
    *,
    code: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
    accuracy_m: Optional[float],
    is_mocked: Optional[bool],
) -> Tuple[str, Optional[float], Optional[float], Optional[float], Optional[bool]]:
    resolved_code = normalize_attendance_qr_input(payload.code if payload else code)
    resolved_lat = to_float_or_none(payload.latitude if payload and payload.latitude is not None else latitude)
    resolved_lng = to_float_or_none(payload.longitude if payload and payload.longitude is not None else longitude)
    resolved_accuracy = to_float_or_none(payload.accuracy_m if payload and payload.accuracy_m is not None else accuracy_m)
    resolved_mocked = payload.is_mocked if payload and payload.is_mocked is not None else is_mocked
    return resolved_code, resolved_lat, resolved_lng, resolved_accuracy, resolved_mocked

def validate_qr_scan_member_location(
    *,
    member_center: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
    accuracy_m: Optional[float],
    is_mocked: Optional[bool],
):
    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Location is required for QR attendance scan.",
        )

    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid location coordinates.")

    if (
        ATTENDANCE_QR_BLOCK_MOCK_LOCATION
        and is_mocked is True
    ):
        raise HTTPException(
            status_code=400,
            detail="Mock location is not allowed for QR attendance.",
        )

    if accuracy_m is not None and accuracy_m > ATTENDANCE_QR_MAX_GPS_ACCURACY_METERS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Location accuracy is too low. Move near the gym entrance and try again "
                f"(accuracy <= {int(ATTENDANCE_QR_MAX_GPS_ACCURACY_METERS)}m required)."
            ),
        )

    center_coordinates = resolve_center_coordinates(member_center)
    if not center_coordinates:
        raise HTTPException(status_code=400, detail="Member center coordinates are not configured.")

    distance_m = haversine_distance_meters(
        latitude,
        longitude,
        center_coordinates[0],
        center_coordinates[1],
    )
    if distance_m > ATTENDANCE_QR_GEOFENCE_METERS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"QR scan allowed only inside gym perimeter. You are about {int(distance_m)}m away from "
                f"{member_center} center."
            ),
        )

def format_india_time(dt_value: datetime) -> str:
    normalized = coerce_utc_naive_datetime(dt_value, datetime.utcnow()) or datetime.utcnow()
    india_dt = normalized.replace(tzinfo=timezone.utc).astimezone(INDIA_TIMEZONE)
    return india_dt.strftime("%d %b %Y, %I:%M %p IST")

async def enforce_recheckin_cooldown(user_id: str, *, now: Optional[datetime] = None):
    if ATTENDANCE_RECHECKIN_COOLDOWN_HOURS <= 0:
        return

    reference_now = now or datetime.utcnow()
    latest_checkout_record = await db.attendance.find_one(
        {"user_id": user_id, "check_out_time": {"$ne": None}},
        sort=[("check_out_time", -1)],
    )
    if not latest_checkout_record:
        return

    last_checkout = coerce_utc_naive_datetime(latest_checkout_record.get("check_out_time"), reference_now)
    if not last_checkout:
        return

    next_allowed = last_checkout + timedelta(hours=ATTENDANCE_RECHECKIN_COOLDOWN_HOURS)
    if next_allowed > reference_now:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Re-check-in is available after {format_india_time(next_allowed)} "
                f"({ATTENDANCE_RECHECKIN_COOLDOWN_HOURS}-hour cooldown after check-out)."
            ),
        )

def build_shared_attendance_qr_code() -> str:
    return f"HERCULES-QR-{uuid.uuid4().hex[:10].upper()}"

async def ensure_shared_attendance_qr() -> Dict[str, str]:
    settings = await db.app_settings.find_one({"key": APP_SETTING_ATTENDANCE_QR_KEY})
    stored_code = (settings or {}).get("code")
    shared_code = ATTENDANCE_SHARED_QR_CODE or stored_code or build_shared_attendance_qr_code()
    payload = {
        "key": APP_SETTING_ATTENDANCE_QR_KEY,
        "code": shared_code,
        "qr_value": build_attendance_qr_payload(shared_code),
        "updated_at": datetime.utcnow(),
    }
    await db.app_settings.update_one(
        {"key": APP_SETTING_ATTENDANCE_QR_KEY},
        {"$set": payload, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True,
    )
    return payload

async def ensure_daily_qr_codes(day: str) -> Dict[str, str]:
    # Legacy compatibility wrapper: returns the same shared QR code for all actions.
    shared = await ensure_shared_attendance_qr()
    shared_code = shared.get("code") or ""
    shared_qr_value = shared.get("qr_value") or build_attendance_qr_payload(shared_code)
    payload = {
        "date": day,
        "code": shared_code,
        "check_in_code": shared_code,
        "check_out_code": shared_code,
        "qr_value": shared_qr_value,
        "check_in_qr_value": shared_qr_value,
        "check_out_qr_value": shared_qr_value,
    }
    return payload

async def finalize_expired_attendance_sessions() -> int:
    now = datetime.utcnow()
    timeout_cutoff = now - timedelta(hours=ATTENDANCE_MAX_ACTIVE_HOURS)
    stale_records = await db.attendance.find(
        {
            "check_out_time": None,
            "check_in_time": {"$lte": timeout_cutoff},
        }
    ).to_list(5000)

    modified = 0
    for record in stale_records:
        record_id = record.get("id")
        if not record_id:
            continue
        check_in_at = record.get("check_in_time") or now
        auto_checkout_at = check_in_at + timedelta(hours=ATTENDANCE_MAX_ACTIVE_HOURS)
        update_result = await db.attendance.update_one(
            {"id": record_id, "check_out_time": None},
            {
                "$set": {
                    "check_out_time": auto_checkout_at,
                    "check_out_method": "auto_timeout",
                    "auto_checked_out": True,
                    "penalty_applied": True,
                    "penalty_reason": "missed_qr_checkout",
                    "penalty_note": f"Auto checkout after {ATTENDANCE_MAX_ACTIVE_HOURS}h without QR checkout.",
                }
            },
        )
        if update_result.modified_count:
            modified += 1
    return modified

async def cleanup_expired_attendance_records() -> int:
    cutoff = get_attendance_retention_cutoff()
    delete_result = await db.attendance.delete_many({"check_in_time": {"$lt": cutoff}})
    return int(delete_result.deleted_count)

# ==================== ATTENDANCE ROUTES ====================

@api_router.post("/attendance/check-in")
async def check_in(attendance: AttendanceCreate, current_user: UserInDB = Depends(get_current_user)):
    await finalize_expired_attendance_sessions()

    # Validate access
    if current_user.role == "member":
        if attendance.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Can only check in yourself")
        attendance.method = "self"
    elif current_user.role == "trainer":
        member_user = await db.users.find_one({"id": attendance.user_id, "role": "member"})
        if not member_user:
            raise HTTPException(status_code=404, detail="Member not found")
        if member_user.get("center") != current_user.center:
            raise HTTPException(status_code=403, detail="Can only check in members from your branch")
    
    # Get user's center
    user = await db.users.find_one({"id": attendance.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Do not allow a new session while any prior session is still active.
    existing = await db.attendance.find_one({
        "user_id": attendance.user_id,
        "check_out_time": None
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in")

    await enforce_recheckin_cooldown(attendance.user_id)
    
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
    await finalize_expired_attendance_sessions()

    # Validate access
    if current_user.role == "member" and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only check out yourself")
    
    # Find active check-in (not limited to same-day so midnight-crossing sessions can be closed).
    record = await db.attendance.find_one({
        "user_id": user_id,
        "check_out_time": None
    }, sort=[("check_in_time", -1)])
    
    if not record:
        raise HTTPException(status_code=400, detail="No active check-in found")

    if (
        ATTENDANCE_ENFORCE_QR_CHECKOUT
        and current_user.role == "member"
        and user_id == current_user.id
        and record.get("method") == "qr"
    ):
        raise HTTPException(status_code=400, detail="Please use QR check-out")
    
    checkout_time = datetime.utcnow()
    await db.attendance.update_one(
        {"id": record["id"]},
        {
            "$set": {
                "check_out_time": checkout_time,
                "check_out_method": "self" if current_user.id == user_id else "manual",
                "auto_checked_out": False,
            }
        }
    )
    
    next_allowed = checkout_time + timedelta(hours=ATTENDANCE_RECHECKIN_COOLDOWN_HOURS)
    return {
        "message": "Checked out successfully",
        "next_checkin_at": next_allowed.isoformat(),
    }

@api_router.get("/attendance/today")
async def get_today_attendance(
    center: Optional[CenterType] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    await finalize_expired_attendance_sessions()
    today_start = get_day_start_utc()
    
    if current_user.role == "member":
        records = await db.attendance.find({
            "user_id": current_user.id,
            "check_in_time": {"$gte": today_start}
        }).sort("check_in_time", -1).to_list(100)
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
        records = await db.attendance.find(query).sort("check_in_time", -1).to_list(1000)
    else:
        # Admin sees all
        query = {"check_in_time": {"$gte": today_start}}
        if center:
            query["center"] = center
        records = await db.attendance.find(query).sort("check_in_time", -1).to_list(1000)
    
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
    months: int = Query(ATTENDANCE_HISTORY_MONTHS_LIMIT, ge=1, le=ATTENDANCE_HISTORY_MONTHS_LIMIT),
    current_user: UserInDB = Depends(get_current_user)
):
    await finalize_expired_attendance_sessions()

    target_user = await db.users.find_one({"id": user_id, "is_active": True})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Members can only see their own attendance.
    if current_user.role == "member":
        if current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Trainer/admin member-history view is restricted to members only.
        if target_user.get("role") != "member":
            raise HTTPException(status_code=403, detail="Attendance history is available for members only")

        # Branch-wise visibility: trainer/non-primary admin can only access own center members.
        target_center = target_user.get("center")
        if current_user.role == "trainer":
            if current_user.center and target_center != current_user.center:
                raise HTTPException(status_code=403, detail="Access denied for another center")
        elif current_user.role == "admin":
            if not current_user.is_primary_admin and current_user.center and target_center != current_user.center:
                raise HTTPException(status_code=403, detail="Access denied for another center")

    now = datetime.utcnow()
    default_start = add_months_utc(get_day_start_utc(now), -months)
    normalized_start = to_utc_naive(start_date) if start_date else None
    normalized_end = to_utc_naive(end_date) if end_date else None
    retention_cutoff = get_attendance_retention_cutoff()
    effective_start = default_start
    if normalized_start:
        effective_start = max(effective_start, normalized_start)
    effective_start = max(effective_start, retention_cutoff)

    effective_end = normalized_end or now
    if effective_end < effective_start:
        raise HTTPException(status_code=400, detail="Invalid date range")

    query = {"user_id": user_id, "check_in_time": {"$gte": effective_start, "$lte": effective_end}}
    
    records = await db.attendance.find(query).sort("check_in_time", -1).to_list(1000)
    return [sanitize_mongo_doc(r) for r in records]

@api_router.get("/attendance/qr-code")
async def get_qr_code(current_user: UserInDB = Depends(require_admin)):
    shared = await ensure_shared_attendance_qr()
    return {
        "code": shared.get("code"),
        "qr_value": shared.get("qr_value"),
    }

@api_router.post("/attendance/qr-scan")
async def qr_scan(
    payload: Optional[QrScanRequest] = None,
    code: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    accuracy_m: Optional[float] = Query(None),
    is_mocked: Optional[bool] = Query(None),
    current_user: UserInDB = Depends(get_current_user),
):
    await finalize_expired_attendance_sessions()

    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can use QR attendance scan")

    scanned_code, scan_latitude, scan_longitude, scan_accuracy, scan_is_mocked = resolve_qr_scan_payload(
        payload,
        code=code,
        latitude=latitude,
        longitude=longitude,
        accuracy_m=accuracy_m,
        is_mocked=is_mocked,
    )
    shared = await ensure_shared_attendance_qr()
    expected_code = (shared.get("code") or "").strip()

    if not expected_code or scanned_code != expected_code:
        raise HTTPException(status_code=400, detail="Invalid QR code")

    validate_qr_scan_member_location(
        member_center=current_user.center,
        latitude=scan_latitude,
        longitude=scan_longitude,
        accuracy_m=scan_accuracy,
        is_mocked=scan_is_mocked,
    )

    active_record = await db.attendance.find_one(
        {"user_id": current_user.id, "check_out_time": None},
        sort=[("check_in_time", -1)],
    )
    if active_record:
        checkout_time = datetime.utcnow()
        await db.attendance.update_one(
            {"id": active_record["id"]},
            {
                "$set": {
                    "check_out_time": checkout_time,
                    "check_out_method": "qr",
                    "auto_checked_out": False,
                }
            },
        )
        next_allowed = checkout_time + timedelta(hours=ATTENDANCE_RECHECKIN_COOLDOWN_HOURS)
        return {
            "action": "checkout",
            "message": "QR Check-out successful",
            "next_checkin_at": next_allowed.isoformat(),
        }

    await enforce_recheckin_cooldown(current_user.id)

    record = AttendanceRecord(
        user_id=current_user.id,
        center=current_user.center or "Ranaghat",
        method="qr",
    )
    await db.attendance.insert_one(record.dict())
    return {
        "action": "checkin",
        "message": "QR Check-in successful",
        "record": record.dict(),
    }

@api_router.post("/attendance/qr-check-in")
async def qr_check_in(
    payload: Optional[QrScanRequest] = None,
    code: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    accuracy_m: Optional[float] = Query(None),
    is_mocked: Optional[bool] = Query(None),
    current_user: UserInDB = Depends(get_current_user),
):
    await finalize_expired_attendance_sessions()

    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can use QR check-in")

    scanned_code, scan_latitude, scan_longitude, scan_accuracy, scan_is_mocked = resolve_qr_scan_payload(
        payload,
        code=code,
        latitude=latitude,
        longitude=longitude,
        accuracy_m=accuracy_m,
        is_mocked=is_mocked,
    )
    shared = await ensure_shared_attendance_qr()
    expected_code = (shared.get("code") or "").strip()

    if not expected_code or expected_code != scanned_code:
        raise HTTPException(status_code=400, detail="Invalid QR code")

    validate_qr_scan_member_location(
        member_center=current_user.center,
        latitude=scan_latitude,
        longitude=scan_longitude,
        accuracy_m=scan_accuracy,
        is_mocked=scan_is_mocked,
    )
    
    # Do not allow a new session while any prior session is still active.
    existing = await db.attendance.find_one({
        "user_id": current_user.id,
        "check_out_time": None,
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in")

    await enforce_recheckin_cooldown(current_user.id)
    
    record = AttendanceRecord(
        user_id=current_user.id,
        center=current_user.center or "Ranaghat",
        method="qr"
    )
    
    await db.attendance.insert_one(record.dict())
    
    return {"message": "QR Check-in successful", "record": record.dict()}

@api_router.post("/attendance/qr-check-out")
async def qr_check_out(
    payload: Optional[QrScanRequest] = None,
    code: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    accuracy_m: Optional[float] = Query(None),
    is_mocked: Optional[bool] = Query(None),
    current_user: UserInDB = Depends(get_current_user),
):
    await finalize_expired_attendance_sessions()

    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Only members can use QR check-out")

    scanned_code, scan_latitude, scan_longitude, scan_accuracy, scan_is_mocked = resolve_qr_scan_payload(
        payload,
        code=code,
        latitude=latitude,
        longitude=longitude,
        accuracy_m=accuracy_m,
        is_mocked=is_mocked,
    )
    shared = await ensure_shared_attendance_qr()
    expected_code = (shared.get("code") or "").strip()
    if not expected_code or expected_code != scanned_code:
        raise HTTPException(status_code=400, detail="Invalid QR code")

    validate_qr_scan_member_location(
        member_center=current_user.center,
        latitude=scan_latitude,
        longitude=scan_longitude,
        accuracy_m=scan_accuracy,
        is_mocked=scan_is_mocked,
    )

    record = await db.attendance.find_one(
        {
            "user_id": current_user.id,
            "check_out_time": None,
        },
        sort=[("check_in_time", -1)],
    )
    if not record:
        raise HTTPException(status_code=400, detail="No active check-in found")

    checkout_time = datetime.utcnow()
    await db.attendance.update_one(
        {"id": record["id"]},
        {
            "$set": {
                "check_out_time": checkout_time,
                "check_out_method": "qr",
                "auto_checked_out": False,
            }
        },
    )
    next_allowed = checkout_time + timedelta(hours=ATTENDANCE_RECHECKIN_COOLDOWN_HOURS)
    return {
        "message": "QR Check-out successful",
        "next_checkin_at": next_allowed.isoformat(),
    }

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
    receiver = await db.users.find_one({"id": message.receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    sender_dict = current_user.model_dump()
    allowed, reason = await can_users_chat(sender_dict, receiver)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason or "Chat not allowed")

    msg = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content,
        message_type=message.message_type
    )
    
    await db.messages.insert_one(msg.dict())

    # Persist in-app notification and trigger push delivery for receiver.
    try:
        if message.receiver_id != current_user.id:
            preview = (message.content or "").strip()
            if len(preview) > 80:
                preview = f"{preview[:77]}..."
            await send_notification_to_user(
                message.receiver_id,
                f"New message from {current_user.full_name}",
                preview or "You received a new message.",
                "general",
                {
                    "sender_id": current_user.id,
                    "receiver_id": message.receiver_id,
                    "message_id": msg.id,
                    "type": "message",
                },
            )
    except Exception as exc:
        logger.error(f"Message notification failed for {msg.id}: {exc}")

    # Keep message delivery robust: persistence success should not fail due conversation/socket side-effects.
    try:
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
    except Exception as exc:
        logger.error(f"Conversation update failed for message {msg.id}: {exc}")

    try:
        await sio.emit(f"message_{message.receiver_id}", msg.dict())
    except Exception as exc:
        logger.error(f"Socket emit failed for message {msg.id}: {exc}")
    
    return msg.dict()

@api_router.get("/messages/contacts")
async def get_message_contacts(current_user: UserInDB = Depends(get_current_user)):
    base_user_fields = {
        "id": 1,
        "full_name": 1,
        "email": 1,
        "role": 1,
        "center": 1,
        "profile_image": 1,
        "is_primary_admin": 1,
        "is_active": 1,
        "approval_status": 1,
    }

    contacts: List[Dict] = []

    if current_user.role == "member":
        users = await db.users.find(
            {
                "id": {"$ne": current_user.id},
                "center": current_user.center,
                "is_active": True,
                "approval_status": "approved",
                "role": {"$in": ["admin", "trainer", "member"]},
            },
            base_user_fields,
        ).to_list(2000)
        contacts.extend(users)
    elif current_user.role == "trainer":
        member_query: Dict = {
            "role": "member",
            "center": current_user.center,
            "is_active": True,
            "approval_status": "approved",
        }
        trainer_query: Dict = {
            "role": "trainer",
            "id": {"$ne": current_user.id},
            "center": current_user.center,
            "is_active": True,
            "approval_status": "approved",
        }
        admin_query: Dict = {
            "role": "admin",
            "is_active": True,
            "approval_status": "approved",
        }
        members = await db.users.find(member_query, base_user_fields).to_list(2000)
        trainers = await db.users.find(trainer_query, base_user_fields).to_list(2000)
        admins = await db.users.find(admin_query, base_user_fields).to_list(2000)
        contacts.extend(members + trainers + admins)
    elif current_user.role == "admin":
        if current_user.is_primary_admin:
            query = {
                "id": {"$ne": current_user.id},
                "is_active": True,
                "approval_status": "approved",
            }
        elif not current_user.center:
            query = {
                "id": {"$ne": current_user.id},
                "is_active": True,
                "approval_status": "approved",
            }
        else:
            query = {
                "id": {"$ne": current_user.id},
                "is_active": True,
                "approval_status": "approved",
                "$or": [
                    {"center": current_user.center},
                    {"role": "admin", "is_primary_admin": True},
                ],
            }
        contacts = await db.users.find(query, base_user_fields).to_list(5000)

    # Dedupe and sort for stable UI rendering.
    seen = set()
    deduped = []
    for contact in contacts:
        contact_id = contact.get("id")
        if not contact_id or contact_id in seen:
            continue
        seen.add(contact_id)
        deduped.append(contact)

    role_order = {"admin": 0, "trainer": 1, "member": 2}
    deduped.sort(key=lambda c: (role_order.get(c.get("role", "member"), 99), c.get("full_name", "").lower()))

    return [
        {
            "id": c["id"],
            "full_name": c.get("full_name"),
            "email": c.get("email"),
            "role": c.get("role"),
            "center": c.get("center"),
            "profile_image": c.get("profile_image"),
            "is_primary_admin": c.get("is_primary_admin", False),
        }
        for c in deduped
    ]

@api_router.post("/messages/delete-selected")
async def delete_selected_messages(
    payload: MessageDeleteRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    if not payload.message_ids:
        return {"message": "No messages selected", "deleted_count": 0}

    selected_messages = await db.messages.find(
        {
            "id": {"$in": payload.message_ids},
            "$or": [
                {"sender_id": current_user.id},
                {"receiver_id": current_user.id},
            ],
        }
    ).to_list(2000)

    if not selected_messages:
        return {"message": "No deletable messages found", "deleted_count": 0}

    message_ids = [m["id"] for m in selected_messages]
    participant_pairs = {
        tuple(sorted([m["sender_id"], m["receiver_id"]])) for m in selected_messages
    }

    delete_result = await db.messages.delete_many({"id": {"$in": message_ids}})
    for user_a_id, user_b_id in participant_pairs:
        await rebuild_conversation_state(user_a_id, user_b_id)

    return {"message": "Selected messages deleted", "deleted_count": delete_result.deleted_count}

@api_router.delete("/messages/conversations/{other_user_id}")
async def delete_conversation(other_user_id: str, current_user: UserInDB = Depends(get_current_user)):
    if other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Invalid conversation")

    participants = sorted([current_user.id, other_user_id])
    deleted_messages = await db.messages.delete_many(
        {
            "$or": [
                {"sender_id": current_user.id, "receiver_id": other_user_id},
                {"sender_id": other_user_id, "receiver_id": current_user.id},
            ]
        }
    )
    await db.conversations.delete_one({"participant_ids": participants})

    return {"message": "Conversation deleted", "deleted_count": deleted_messages.deleted_count}

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: UserInDB = Depends(get_current_user)):
    other_user = await db.users.find_one({"id": other_user_id})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    sender_dict = current_user.model_dump()
    allowed, reason = await can_users_chat(sender_dict, other_user)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason or "Chat not allowed")

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
    sender_dict = current_user.model_dump()
    for conv in conversations:
        other_id = [p for p in conv["participant_ids"] if p != current_user.id][0]
        other_user = await db.users.find_one({"id": other_id})
        if not other_user:
            continue
        allowed, _ = await can_users_chat(sender_dict, other_user)
        if allowed:
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
    expires_at = announcement.expires_at
    if announcement.announcement_type == "achievement" and not expires_at:
        expires_at = datetime.utcnow() + timedelta(days=ACHIEVEMENT_ANNOUNCEMENT_DAYS)

    target_users = announcement.target_users
    if announcement.target != "selected":
        target_users = []

    if announcement.target == "members_center" and not announcement.target_center:
        raise HTTPException(status_code=400, detail="target_center is required for members_center announcements")

    ann = Announcement(
        title=announcement.title,
        content=announcement.content,
        created_by=current_user.id,
        target=announcement.target,
        target_center=announcement.target_center,
        target_users=target_users,
        announcement_type=announcement.announcement_type,
        expires_at=expires_at,
    )
    
    await db.announcements.insert_one(ann.dict())

    ann_payload = ann.dict()
    recipient_ids: List[str] = []
    if announcement.target == "all":
        users = await db.users.find({"is_active": True}, {"id": 1}).to_list(5000)
        recipient_ids = [u.get("id") for u in users if u.get("id")]
    elif announcement.target == "members":
        users = await db.users.find({"role": "member", "is_active": True}, {"id": 1}).to_list(2000)
        recipient_ids = [u.get("id") for u in users if u.get("id")]
    elif announcement.target == "members_center" and announcement.target_center:
        users = await db.users.find(
            {"role": "member", "center": announcement.target_center, "is_active": True},
            {"id": 1},
        ).to_list(2000)
        recipient_ids = [u.get("id") for u in users if u.get("id")]
    elif announcement.target == "trainers":
        users = await db.users.find({"role": "trainer", "is_active": True}, {"id": 1}).to_list(2000)
        recipient_ids = [u.get("id") for u in users if u.get("id")]
    elif announcement.target == "center" and announcement.target_center:
        users = await db.users.find(
            {"center": announcement.target_center, "is_active": True},
            {"id": 1},
        ).to_list(5000)
        recipient_ids = [u.get("id") for u in users if u.get("id")]
    else:
        recipient_ids = [user_id for user_id in target_users if user_id]

    if current_user.id in recipient_ids:
        recipient_ids = [uid for uid in recipient_ids if uid != current_user.id]

    try:
        if announcement.target == "all":
            await sio.emit("announcement", ann_payload)
        if recipient_ids:
            await asyncio.gather(
                *[sio.emit(f"announcement_{user_id}", ann_payload) for user_id in recipient_ids],
                return_exceptions=True,
            )
    except Exception as exc:
        logger.error(f"Announcement emit failed for {ann.id}: {exc}")

    if recipient_ids:
        preview_body = announcement.content.strip()
        if len(preview_body) > 140:
            preview_body = f"{preview_body[:137]}..."
        await asyncio.gather(
            *[
                send_notification_to_user(
                    user_id,
                    f"Announcement: {announcement.title}",
                    preview_body,
                    "announcement",
                    {"announcement_id": ann.id, "target": announcement.target},
                )
                for user_id in recipient_ids
            ],
            return_exceptions=True,
        )

    return ann.dict()

@api_router.get("/announcements")
async def get_announcements(
    limit: int = Query(100, ge=1, le=100),
    current_user: UserInDB = Depends(get_current_user),
):
    now = datetime.utcnow()
    query = {
        "is_active": True,
        "$and": [
            {
                "$or": [
                    {"expires_at": {"$exists": False}},
                    {"expires_at": None},
                    {"expires_at": {"$gt": now}},
                ]
            }
        ],
    }
    
    if current_user.role != "admin":
        target_filters = [
            {"target": "all"},
            {"target": current_user.role + "s"},
            {"target_users": current_user.id},
            {"target": "center", "target_center": current_user.center}
        ]
        if current_user.role == "member" and current_user.center:
            target_filters.append({"target": "members_center", "target_center": current_user.center})
        query["$and"].append({"$or": target_filters})
    
    announcements = await db.announcements.find(query).sort("created_at", -1).to_list(limit)

    creator_ids = list({ann.get("created_by") for ann in announcements if ann.get("created_by")})
    creators_by_id: Dict[str, str] = {}
    if creator_ids:
        creators = await db.users.find(
            {"id": {"$in": creator_ids}},
            {"id": 1, "full_name": 1},
        ).to_list(len(creator_ids))
        creators_by_id = {
            creator.get("id"): creator.get("full_name")
            for creator in creators
            if creator.get("id") and creator.get("full_name")
        }

    for ann in announcements:
        sanitize_mongo_doc(ann)
        creator_name = creators_by_id.get(ann.get("created_by"))
        if creator_name:
            ann["creator_name"] = creator_name

    return announcements

@api_router.put("/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    update: AnnouncementUpdate,
    current_user: UserInDB = Depends(require_admin)
):
    existing = await db.announcements.find_one({"id": announcement_id, "is_active": True})
    if not existing:
        raise HTTPException(status_code=404, detail="Announcement not found")

    update_data = {k: v for k, v in update.model_dump(exclude_unset=True).items()}
    if not update_data:
        return sanitize_mongo_doc(existing)

    next_target = update_data.get("target", existing.get("target"))
    next_center = update_data.get("target_center", existing.get("target_center"))
    if next_target == "members_center" and not next_center:
        raise HTTPException(status_code=400, detail="target_center is required for members_center announcements")
    if next_target != "selected":
        update_data["target_users"] = []

    update_data["updated_at"] = datetime.utcnow()
    await db.announcements.update_one({"id": announcement_id}, {"$set": update_data})

    updated = await db.announcements.find_one({"id": announcement_id})
    if not updated:
        raise HTTPException(status_code=404, detail="Announcement not found")

    payload = sanitize_mongo_doc(updated)
    try:
        await sio.emit("announcement_updated", payload)
    except Exception as exc:
        logger.error(f"Announcement update emit failed for {announcement_id}: {exc}")

    return payload

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: UserInDB = Depends(require_admin)
):
    result = await db.announcements.update_one(
        {"id": announcement_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
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
    
    payment_proof_image = normalize_payment_proof_image(order.payment_proof_image)

    # Create order and mark payment as pending verification
    payment_reference = f"SHOP-{uuid.uuid4().hex[:10].upper()}"

    merchandise_order = MerchandiseOrder(
        user_id=current_user.id,
        user_name=current_user.full_name,
        center=current_user.center or "Ranaghat",
        items=order_items,
        total_amount=total_amount,
        notes=order.notes,
        payment_status="pending",
        payment_method=order.payment_method or "upi",
        payment_reference=payment_reference,
    )

    await db.merchandise_orders.insert_one(merchandise_order.dict())

    payment = Payment(
        member_id=current_user.id,
        amount=total_amount,
        payment_type="merchandise",
        payment_method=order.payment_method or "upi",
        description=f"Shop purchase payment for order {merchandise_order.id}",
        status="pending",
        recorded_by=current_user.id,
        center=current_user.center or "Ranaghat",
        base_amount=total_amount,
        late_fee=0,
        payment_reference=payment_reference,
        order_id=merchandise_order.id,
        proof_image=payment_proof_image,
    )
    await db.payments.insert_one(payment.dict())

    # Notify all admins
    items_summary = ", ".join([f"{i['name']} ({i['size']}) x{i['quantity']}" for i in order_items])
    await notify_all_admins(
        "Merchandise Payment Proof Submitted",
        (
            f"{current_user.full_name} from {current_user.center} submitted shop payment proof. "
            f"Items: {items_summary}. Total: Rs.{total_amount}"
        ),
        "merchandise",
        {"order_id": merchandise_order.id, "user_id": current_user.id, "payment_id": payment.id}
    )

    await send_notification_to_user(
        current_user.id,
        "Payment Proof Submitted",
        "Shop payment screenshot submitted. Waiting for admin confirmation.",
        "merchandise",
        {"order_id": merchandise_order.id, "payment_reference": payment_reference},
    )

    response = merchandise_order.dict()
    response["payment_success"] = False
    response["payment_message"] = "Payment screenshot submitted. Awaiting admin confirmation."
    response["payment_id"] = payment.id
    return response

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

    profile = await db.member_profiles.find_one({"user_id": payment.member_id})
    membership = normalize_membership_plan(profile.get("membership") if profile else None)
    due_details = get_membership_due_details(membership) if membership else None

    base_amount = payment.amount
    late_fee = 0.0
    membership_due_date = None
    if payment.payment_type == "membership" and due_details:
        base_amount = due_details["base_amount"]
        late_fee = max(0.0, round(payment.amount - base_amount, 2))
        membership_due_date = due_details["due_date"]

    pay = Payment(
        member_id=payment.member_id,
        amount=payment.amount,
        payment_type=payment.payment_type,
        payment_method=payment.payment_method,
        description=payment.description,
        status=payment.status,
        recorded_by=current_user.id,
        center=member.get("center", "Ranaghat"),
        base_amount=base_amount,
        late_fee=late_fee,
        membership_due_date=membership_due_date,
        order_id=payment.order_id,
    )

    await db.payments.insert_one(pay.dict())

    if payment.payment_type == "membership":
        if not profile:
            raise HTTPException(status_code=404, detail="Member profile not found")

        if not membership:
            raise HTTPException(status_code=400, detail="Membership plan not set for this member")

        if payment.next_payment_date:
            next_due_date = coerce_utc_naive_datetime(payment.next_payment_date, datetime.utcnow()) or datetime.utcnow()
        elif due_details:
            next_due_date = next_membership_due_date(
                due_details["due_date"],
                membership.get("billing_anchor_day", due_details["due_date"].day),
            )
        else:
            fallback_due = coerce_utc_naive_datetime(membership.get("next_payment_date"), datetime.utcnow()) or datetime.utcnow()
            next_due_date = next_membership_due_date(
                fallback_due,
                membership.get("billing_anchor_day", fallback_due.day),
            )

        membership["next_payment_date"] = next_due_date
        membership["payment_status"] = "pending"
        membership["last_payment_date"] = datetime.utcnow()
        membership["last_reminder_sent"] = None

        await db.member_profiles.update_one(
            {"user_id": payment.member_id},
            {"$set": {"membership": membership}},
        )

        await send_notification_to_user(
            payment.member_id,
            "Payment Recorded",
            f"Your membership payment of Rs.{payment.amount} has been recorded.",
            "payment",
            {"amount": payment.amount, "next_payment": next_due_date.isoformat()},
        )

    return pay.dict()

@api_router.post("/payments/membership/pay")
async def pay_membership_fee(
    request: MembershipPaymentRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Member access required")

    profile = await db.member_profiles.find_one({"user_id": current_user.id})
    if not profile or not profile.get("membership"):
        raise HTTPException(status_code=400, detail="Membership plan not found")

    membership = normalize_membership_plan(profile.get("membership"))
    if not membership:
        raise HTTPException(status_code=400, detail="Membership plan not found")

    due_details = get_membership_due_details(membership)
    if not due_details:
        raise HTTPException(status_code=400, detail="Unable to determine payment due details")

    if not due_details["is_due_now"]:
        raise HTTPException(
            status_code=400,
            detail=f"Membership payment is not due yet. Next due date is {due_details['due_date'].date().isoformat()}",
        )

    payment_proof_image = normalize_payment_proof_image(request.proof_image)
    payment_reference = f"MEM-{uuid.uuid4().hex[:10].upper()}"
    payment = Payment(
        member_id=current_user.id,
        amount=due_details["total_amount"],
        payment_type="membership",
        payment_method=request.payment_method,
        description=f"Membership fee payment due on {due_details['due_date'].date().isoformat()}",
        status="pending",
        recorded_by=current_user.id,
        center=current_user.center or "Ranaghat",
        base_amount=due_details["base_amount"],
        late_fee=due_details["late_fee"],
        membership_due_date=due_details["due_date"],
        payment_reference=payment_reference,
        proof_image=payment_proof_image,
    )
    await db.payments.insert_one(payment.dict())

    await notify_all_admins(
        "Membership Payment Proof Submitted",
        (
            f"{current_user.full_name} from {current_user.center} submitted membership payment proof "
            f"for Rs.{due_details['total_amount']}."
        ),
        "payment",
        {"payment_id": payment.id, "member_id": current_user.id, "payment_type": "membership"},
    )
    await send_notification_to_user(
        current_user.id,
        "Payment Proof Submitted",
        "Membership payment screenshot submitted. Waiting for admin confirmation.",
        "payment",
        {
            "amount": due_details["total_amount"],
            "base_amount": due_details["base_amount"],
            "late_fee": due_details["late_fee"],
            "payment_reference": payment_reference,
            "payment_id": payment.id,
        },
    )

    return {
        "message": "Membership payment proof submitted",
        "payment": payment.dict(),
    }

@api_router.get("/payments/summary/me")
async def get_my_payment_summary(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "member":
        raise HTTPException(status_code=403, detail="Member access required")

    profile = await db.member_profiles.find_one({"user_id": current_user.id})
    membership = normalize_membership_plan(profile.get("membership") if profile else None)
    if profile and not membership:
        membership = build_default_membership_plan(current_user.created_at)
        await db.member_profiles.update_one(
            {"user_id": current_user.id},
            {"$set": {"membership": membership}},
            upsert=True,
        )
        profile["membership"] = membership
    if membership:
        membership, aligned = align_membership_with_join_date(
            membership,
            current_user.created_at,
            reference_now=datetime.utcnow(),
        )
        if aligned:
            await db.member_profiles.update_one(
                {"user_id": current_user.id},
                {"$set": {"membership": membership}},
            )
            if profile:
                profile["membership"] = membership
    due_details = get_membership_due_details(membership) if membership else None
    active_due_details = due_details if due_details and due_details.get("is_due_now") else None

    if profile and membership and membership != profile.get("membership"):
        await db.member_profiles.update_one(
            {"user_id": current_user.id},
            {"$set": {"membership": membership}},
        )

    membership_history = await db.payments.find(
        {"member_id": current_user.id, "payment_type": "membership", "status": "completed"}
    ).sort("payment_date", -1).to_list(3)

    shop_history = await db.payments.find(
        {"member_id": current_user.id, "payment_type": "merchandise", "status": "completed"}
    ).sort("payment_date", -1).to_list(3)

    pending_submissions = await db.payments.find(
        {"member_id": current_user.id, "status": {"$in": ["pending", "failed"]}}
    ).sort("payment_date", -1).to_list(5)

    return {
        "membership_due": active_due_details,
        "membership_plan": membership,
        "membership_history": [sanitize_mongo_doc(p) for p in membership_history],
        "shop_history": [sanitize_mongo_doc(p) for p in shop_history],
        "pending_submissions": [sanitize_mongo_doc(p) for p in pending_submissions],
    }

@api_router.get("/payments/summary/admin")
async def get_admin_payment_summary(
    center: Optional[CenterType] = Query(None),
    history_limit: int = Query(100, ge=20, le=500),
    current_user: UserInDB = Depends(require_admin),
):
    selected_center = center
    if not current_user.is_primary_admin:
        user_center = current_user.center
        if center and user_center and center != user_center:
            raise HTTPException(status_code=403, detail="Access denied for selected center")
        selected_center = user_center

    base_match: Dict[str, object] = {"status": "completed"}
    if selected_center:
        base_match["center"] = selected_center

    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_match = {**base_match, "payment_date": {"$gte": month_start}}

    async def aggregate_by_type(match_query: Dict[str, object]):
        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": "$payment_type",
                    "total_amount": {"$sum": "$amount"},
                    "count": {"$sum": 1},
                }
            },
        ]
        rows = await db.payments.aggregate(pipeline).to_list(10)
        summary = {
            "membership_revenue": 0.0,
            "shop_revenue": 0.0,
            "membership_payments_count": 0,
            "shop_payments_count": 0,
        }
        for row in rows:
            payment_type = row.get("_id")
            total_amount = float(row.get("total_amount") or 0.0)
            count = int(row.get("count") or 0)
            if payment_type == "membership":
                summary["membership_revenue"] = total_amount
                summary["membership_payments_count"] = count
            elif payment_type == "merchandise":
                summary["shop_revenue"] = total_amount
                summary["shop_payments_count"] = count
        summary["total_revenue"] = round(summary["membership_revenue"] + summary["shop_revenue"], 2)
        summary["total_payments_count"] = summary["membership_payments_count"] + summary["shop_payments_count"]
        return summary

    totals = await aggregate_by_type(base_match)
    monthly = await aggregate_by_type(month_match)

    recent_payments = await db.payments.find(base_match).sort("payment_date", -1).to_list(history_limit)
    member_ids = list({p.get("member_id") for p in recent_payments if p.get("member_id")})
    users_by_id: Dict[str, dict] = {}
    member_code_by_user_id: Dict[str, str] = {}

    if member_ids:
        users = await db.users.find({"id": {"$in": member_ids}}).to_list(len(member_ids))
        users_by_id = {u["id"]: u for u in users if u.get("id")}

        profiles = await db.member_profiles.find(
            {"user_id": {"$in": member_ids}},
            {"user_id": 1, "member_id": 1, "_id": 0},
        ).to_list(len(member_ids))
        member_code_by_user_id = {
            p.get("user_id"): p.get("member_id")
            for p in profiles
            if p.get("user_id") and p.get("member_id")
        }

    history = []
    for payment in recent_payments:
        payment_doc = sanitize_mongo_doc(payment)
        member_id = payment_doc.get("member_id")
        member_user = users_by_id.get(member_id or "", {})
        payment_doc["member_name"] = member_user.get("full_name")
        payment_doc["member_code"] = member_code_by_user_id.get(member_id or "")
        history.append(payment_doc)

    pending_query: Dict[str, object] = {"status": "pending"}
    if selected_center:
        pending_query["center"] = selected_center
    pending_items = await db.payments.find(pending_query).sort("payment_date", -1).to_list(300)
    pending_member_ids = list({p.get("member_id") for p in pending_items if p.get("member_id")})
    pending_users_by_id: Dict[str, dict] = {}
    pending_member_code_by_user_id: Dict[str, str] = {}
    if pending_member_ids:
        pending_users = await db.users.find({"id": {"$in": pending_member_ids}}).to_list(len(pending_member_ids))
        pending_users_by_id = {u["id"]: u for u in pending_users if u.get("id")}
        pending_profiles = await db.member_profiles.find(
            {"user_id": {"$in": pending_member_ids}},
            {"user_id": 1, "member_id": 1, "_id": 0},
        ).to_list(len(pending_member_ids))
        pending_member_code_by_user_id = {
            p.get("user_id"): p.get("member_id")
            for p in pending_profiles
            if p.get("user_id") and p.get("member_id")
        }

    pending_verifications = []
    for payment in pending_items:
        payment_doc = sanitize_mongo_doc(payment)
        member_id = payment_doc.get("member_id")
        member_user = pending_users_by_id.get(member_id or "", {})
        payment_doc["member_name"] = member_user.get("full_name")
        payment_doc["member_code"] = pending_member_code_by_user_id.get(member_id or "")
        pending_verifications.append(payment_doc)

    return {
        "center": selected_center,
        "totals": totals,
        "monthly": monthly,
        "history": history,
        "pending_verifications": pending_verifications,
    }

@api_router.put("/payments/{payment_id}/verify")
async def verify_payment_submission(
    payment_id: str,
    payload: PaymentVerificationRequest,
    current_user: UserInDB = Depends(require_primary_admin),
):
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending payments can be verified")

    now = datetime.utcnow()
    note = (payload.note or "").strip() or None
    await db.payments.update_one(
        {"id": payment_id},
        {
            "$set": {
                "status": payload.status,
                "verified_by": current_user.id,
                "verified_at": now,
                "verification_note": note,
                "updated_at": now,
            }
        },
    )

    member_id = payment.get("member_id")
    member_user = await db.users.find_one({"id": member_id}) if member_id else None

    if payment.get("payment_type") == "membership" and member_id:
        profile = await db.member_profiles.find_one({"user_id": member_id})
        membership = normalize_membership_plan(profile.get("membership") if profile else None)
        if membership:
            if payload.status == "completed":
                due_reference = coerce_utc_naive_datetime(payment.get("membership_due_date")) or (
                    coerce_utc_naive_datetime(membership.get("next_payment_date"), now) or now
                )
                anchor_day = membership.get("billing_anchor_day", due_reference.day)
                next_due_date = next_membership_due_date(due_reference, anchor_day)
                membership["next_payment_date"] = next_due_date
                membership["payment_status"] = "pending"
                membership["last_payment_date"] = now
                membership["last_reminder_sent"] = None
                await db.member_profiles.update_one({"user_id": member_id}, {"$set": {"membership": membership}})
                await send_notification_to_user(
                    member_id,
                    "Membership Payment Successful",
                    "Payment successful. Your membership payment has been confirmed by admin.",
                    "payment",
                    {
                        "payment_id": payment_id,
                        "amount": payment.get("amount"),
                        "payment_type": "membership",
                        "next_due_date": next_due_date.isoformat(),
                    },
                )
            else:
                await send_notification_to_user(
                    member_id,
                    "Membership Payment Not Confirmed",
                    note or "Payment error observed/not received. Please contact gym admin and re-submit.",
                    "payment",
                    {
                        "payment_id": payment_id,
                        "amount": payment.get("amount"),
                        "payment_type": "membership",
                    },
                )

    if payment.get("payment_type") == "merchandise":
        order_id = payment.get("order_id")
        if order_id:
            order_update: Dict[str, object] = {
                "payment_status": "completed" if payload.status == "completed" else "failed",
                "updated_at": now,
            }
            if payload.status == "completed":
                order_update["payment_date"] = now
            await db.merchandise_orders.update_one({"id": order_id}, {"$set": order_update})

        if member_id:
            if payload.status == "completed":
                await send_notification_to_user(
                    member_id,
                    "Payment Successful",
                    "Payment successful - do collect your items from the gym.",
                    "merchandise",
                    {"payment_id": payment_id, "order_id": order_id},
                )
            else:
                await send_notification_to_user(
                    member_id,
                    "Shop Payment Not Confirmed",
                    note or "Payment error observed/not received. Please re-submit payment screenshot.",
                    "merchandise",
                    {"payment_id": payment_id, "order_id": order_id},
                )

    updated_payment = await db.payments.find_one({"id": payment_id})
    if not updated_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    result = sanitize_mongo_doc(updated_payment)
    if member_user:
        result["member_name"] = member_user.get("full_name")
    return result

@api_router.get("/payments/{member_id}")
async def get_payments(
    member_id: str,
    payment_type: Optional[Literal["membership", "merchandise"]] = Query(None),
    current_user: UserInDB = Depends(get_current_user),
):
    if current_user.role == "member" and current_user.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")

    query: Dict[str, object] = {"member_id": member_id}
    if payment_type:
        query["payment_type"] = payment_type

    payments = await db.payments.find(query).sort("payment_date", -1).to_list(100)
    return [sanitize_mongo_doc(p) for p in payments]

# ==================== WORKOUT PLAN ROUTES ====================

@api_router.post("/workouts")
async def create_workout(
    workout: WorkoutPlanCreate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    await ensure_member_management_access(workout.member_id, current_user)

    normalized_day = workout.day_of_week.strip().title() if workout.day_of_week else None
    
    plan = WorkoutPlan(
        name=workout.name,
        member_id=workout.member_id,
        trainer_id=current_user.id,
        exercises=[e.dict() for e in workout.exercises],
        day_of_week=normalized_day,
        notes=workout.notes
    )
    
    await db.workouts.insert_one(plan.dict())
    return plan.dict()

@api_router.get("/workouts/{member_id}")
async def get_workouts(member_id: str, current_user: UserInDB = Depends(get_current_user)):
    # Check access
    if current_user.role == "member" and current_user.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role in {"trainer", "admin"}:
        await ensure_member_management_access(member_id, current_user)
    
    workouts = await db.workouts.find({"member_id": member_id}).sort("created_at", -1).to_list(300)
    return [sanitize_mongo_doc(w) for w in workouts]

@api_router.put("/workouts/{workout_id}")
async def update_workout(
    workout_id: str,
    workout_update: WorkoutPlanUpdate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    workout = await db.workouts.find_one({"id": workout_id})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    await ensure_member_management_access(workout["member_id"], current_user)

    update_data = workout_update.model_dump(exclude_unset=True)
    if "day_of_week" in update_data and update_data["day_of_week"]:
        update_data["day_of_week"] = update_data["day_of_week"].strip().title()
    if "exercises" in update_data and update_data["exercises"] is not None:
        update_data["exercises"] = [
            e.model_dump() if hasattr(e, "model_dump") else (e.dict() if hasattr(e, "dict") else e)
            for e in update_data["exercises"]
        ]

    if update_data:
        await db.workouts.update_one({"id": workout_id}, {"$set": update_data})

    updated_workout = await db.workouts.find_one({"id": workout_id})
    return sanitize_mongo_doc(updated_workout)

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(
    workout_id: str,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    workout = await db.workouts.find_one({"id": workout_id})
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    await ensure_member_management_access(workout["member_id"], current_user)
    await db.workouts.delete_one({"id": workout_id})
    return {"message": "Workout deleted successfully"}

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
    await ensure_member_management_access(diet.member_id, current_user)
    
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
    
    if current_user.role in {"trainer", "admin"}:
        await ensure_member_management_access(member_id, current_user)
    
    diets = await db.diets.find({"member_id": member_id}).sort("created_at", -1).to_list(300)
    return [sanitize_mongo_doc(d) for d in diets]

@api_router.put("/diets/{diet_id}")
async def update_diet(
    diet_id: str,
    diet_update: DietPlanUpdate,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    diet = await db.diets.find_one({"id": diet_id})
    if not diet:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    await ensure_member_management_access(diet["member_id"], current_user)

    update_data = diet_update.model_dump(exclude_unset=True)
    if "meals" in update_data and update_data["meals"] is not None:
        update_data["meals"] = [
            m.model_dump() if hasattr(m, "model_dump") else (m.dict() if hasattr(m, "dict") else m)
            for m in update_data["meals"]
        ]

    if update_data:
        await db.diets.update_one({"id": diet_id}, {"$set": update_data})

    updated_diet = await db.diets.find_one({"id": diet_id})
    return sanitize_mongo_doc(updated_diet)

@api_router.delete("/diets/{diet_id}")
async def delete_diet(
    diet_id: str,
    current_user: UserInDB = Depends(require_admin_or_trainer)
):
    diet = await db.diets.find_one({"id": diet_id})
    if not diet:
        raise HTTPException(status_code=404, detail="Diet plan not found")

    await ensure_member_management_access(diet["member_id"], current_user)
    await db.diets.delete_one({"id": diet_id})
    return {"message": "Diet plan deleted successfully"}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/admin")
async def admin_dashboard(
    center: Optional[CenterType] = None,
    current_user: UserInDB = Depends(require_admin)
):
    member_query = {"role": "member"}
    if center:
        member_query["center"] = center

    trainer_query = {"role": "trainer", "is_active": True, "approval_status": "approved"}
    if center:
        trainer_query["center"] = center

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    attendance_query = {"check_in_time": {"$gte": today_start}}
    if center:
        attendance_query["center"] = center

    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    payment_query = {"payment_date": {"$gte": month_start}, "status": "completed"}
    if center:
        payment_query["center"] = center

    next_week = now + timedelta(days=7)
    expiring_query = {
        "membership.end_date": {"$lte": next_week, "$gte": now}
    }

    pending_approval_query = build_pending_approvals_query(current_user)

    (
        total_members,
        active_members,
        total_trainers,
        today_attendance,
        payments,
        expiring,
        pending_approvals,
        pending_orders,
    ) = await asyncio.gather(
        db.users.count_documents(member_query),
        db.users.count_documents({**member_query, "is_active": True, "approval_status": "approved"}),
        db.users.count_documents(trainer_query),
        db.attendance.count_documents(attendance_query),
        db.payments.find(payment_query).to_list(1000),
        db.member_profiles.count_documents(expiring_query),
        db.approval_requests.count_documents(pending_approval_query),
        db.merchandise_orders.count_documents({"status": "pending"}),
    )
    monthly_revenue = sum(p["amount"] for p in payments)
    
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
    
    profiles_task = db.member_profiles.find({"assigned_trainers": current_user.id}).to_list(1000)
    assigned_members_task = db.member_profiles.count_documents({"assigned_trainers": current_user.id})
    unread_messages_task = db.messages.count_documents({
        "receiver_id": current_user.id,
        "read": False
    })
    pending_approvals_task = db.approval_requests.count_documents(build_pending_approvals_query(current_user))

    profiles, assigned_members, unread_messages, pending_approvals = await asyncio.gather(
        profiles_task,
        assigned_members_task,
        unread_messages_task,
        pending_approvals_task,
    )

    user_ids = [p["user_id"] for p in profiles]
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_attendance = await db.attendance.count_documents({
        "user_id": {"$in": user_ids},
        "check_in_time": {"$gte": today_start}
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
    membership_valid = True
    days_remaining = 0
    payment_due = False
    payment_due_info = None
    if profile:
        if not profile.get("membership"):
            default_membership = build_default_membership_plan(current_user.created_at)
            await db.member_profiles.update_one(
                {"user_id": current_user.id},
                {"$set": {"membership": default_membership}},
                upsert=True,
            )
            profile["membership"] = default_membership

    if profile and profile.get("membership"):
        membership = normalize_membership_plan(profile["membership"])
        if membership:
            membership, aligned = align_membership_with_join_date(
                membership,
                current_user.created_at,
                reference_now=datetime.utcnow(),
            )
            if aligned:
                await db.member_profiles.update_one(
                    {"user_id": current_user.id},
                    {"$set": {"membership": membership}},
                )
                profile["membership"] = membership
        if membership and membership != profile["membership"]:
            await db.member_profiles.update_one(
                {"user_id": current_user.id},
                {"$set": {"membership": membership}},
            )
            profile["membership"] = membership

        payment_due_info = get_membership_due_details(profile["membership"])
        payment_due = bool(payment_due_info and payment_due_info["is_due_now"])
        if payment_due_info:
            days_remaining = int(payment_due_info.get("days_until_due") or 0)
            membership_valid = not bool(payment_due_info.get("is_overdue"))
        else:
            membership_valid = True
    
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_day = now.strftime("%A")

    (
        attendance_count,
        today_workouts,
        unread_messages,
        unread_notifications,
    ) = await asyncio.gather(
        db.attendance.count_documents({
            "user_id": current_user.id,
            "check_in_time": {"$gte": month_start}
        }),
        db.workouts.find({
            "member_id": current_user.id,
            "day_of_week": {"$regex": f"^{today_day}$", "$options": "i"}
        }).to_list(100),
        db.messages.count_documents({
            "receiver_id": current_user.id,
            "read": False
        }),
        db.notifications.count_documents({
            "user_id": current_user.id,
            "read": False
        }),
    )
    
    return {
        "membership_valid": membership_valid,
        "days_remaining": max(0, days_remaining),
        "payment_due": payment_due,
        "payment_due_info": payment_due_info,
        "attendance_this_month": attendance_count,
        "has_today_workout": len(today_workouts) > 0,
        "today_workout_count": len(today_workouts),
        "unread_messages": unread_messages,
        "unread_notifications": unread_notifications,
        "member_id": profile["member_id"] if profile else None,
        "center": current_user.center,
        "approval_status": current_user.approval_status
    }

@api_router.get("/centers")
async def get_centers():
    return {"centers": GYM_CENTERS}

@api_router.get("/settings/hero-images")
async def get_hero_images(current_user: UserInDB = Depends(get_current_user)):
    _ = current_user
    settings = await db.app_settings.find_one({"key": APP_SETTING_HERO_GALLERY_KEY})
    slides = normalize_hero_gallery(settings.get("slides") if settings else None)
    return {"slides": slides}

@api_router.put("/settings/hero-images")
async def update_hero_images(
    payload: HeroGalleryUpdate,
    current_user: UserInDB = Depends(require_admin),
):
    raw_slides = [slide.model_dump() for slide in payload.slides]
    slides = normalize_hero_gallery(raw_slides)
    now = datetime.utcnow()
    await db.app_settings.update_one(
        {"key": APP_SETTING_HERO_GALLERY_KEY},
        {
            "$set": {
                "slides": slides,
                "updated_by": current_user.id,
                "updated_at": now,
            },
            "$setOnInsert": {"key": APP_SETTING_HERO_GALLERY_KEY, "created_at": now},
        },
        upsert=True,
    )
    return {"slides": slides, "message": "Hero gallery updated"}

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

DATA_DELETION_PAGE_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hercules Gym - Data Deletion Request</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f6f8;
      --card: #ffffff;
      --text: #111111;
      --muted: #616161;
      --line: #d9d9d9;
      --brand: #0b3d91;
      --brand-2: #f6a800;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: linear-gradient(165deg, var(--bg), #eceff3);
      color: var(--text);
      padding: 24px;
    }
    .card {
      max-width: 760px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .head {
      padding: 20px 24px;
      background: linear-gradient(110deg, var(--brand), #0f5ec7);
      color: #fff;
      border-bottom: 4px solid var(--brand-2);
    }
    .head h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      line-height: 1.2;
    }
    .head p {
      margin: 0;
      opacity: 0.95;
    }
    .body {
      padding: 22px 24px 26px;
    }
    .notice {
      background: #f7fbff;
      border: 1px solid #d5e5ff;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 16px;
      color: #1b3762;
      font-size: 14px;
      line-height: 1.45;
    }
    .grid {
      display: grid;
      gap: 12px;
    }
    label {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 6px;
      display: inline-block;
    }
    input, textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 11px 12px;
      font-size: 14px;
      outline: none;
    }
    input:focus, textarea:focus {
      border-color: #7aa9ff;
      box-shadow: 0 0 0 3px rgba(122, 169, 255, 0.18);
    }
    textarea {
      min-height: 96px;
      resize: vertical;
    }
    .hint {
      margin: 3px 0 0;
      color: var(--muted);
      font-size: 12px;
    }
    .actions {
      margin-top: 14px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    button {
      border: 0;
      background: var(--brand);
      color: #fff;
      font-weight: 700;
      padding: 10px 16px;
      border-radius: 10px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }
    #result {
      font-size: 14px;
      font-weight: 600;
    }
    .ok { color: #0c7a2c; }
    .err { color: #a12222; }
    .foot {
      margin-top: 18px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <h1>Hercules Gym Data Deletion Request</h1>
      <p>Request deletion of your account and associated personal data.</p>
    </div>
    <div class="body">
      <div class="notice">
        Use this form if you want your account/data removed. You must provide at least one identifier (email or phone).
        Our admin team will review and process valid requests.
      </div>
      <form id="deletionForm" class="grid">
        <div>
          <label for="full_name">Full Name (optional)</label>
          <input id="full_name" name="full_name" maxlength="120" placeholder="Your full name" />
        </div>
        <div>
          <label for="email">Email (optional)</label>
          <input id="email" name="email" type="email" placeholder="name@example.com" />
        </div>
        <div>
          <label for="phone">Phone (optional)</label>
          <input id="phone" name="phone" placeholder="+91XXXXXXXXXX or 10-digit number" />
          <p class="hint">At least one of email or phone is required.</p>
        </div>
        <div>
          <label for="reason">Reason (optional)</label>
          <textarea id="reason" name="reason" maxlength="1500" placeholder="You can mention context for faster verification."></textarea>
        </div>
        <div class="actions">
          <button id="submitBtn" type="submit">Submit Request</button>
          <span id="result" aria-live="polite"></span>
        </div>
      </form>
      <div class="foot">
        For security, we may verify ownership before deletion is finalized. Operational and legal retention may apply where required.
      </div>
    </div>
  </div>
  <script>
    const form = document.getElementById("deletionForm");
    const submitBtn = document.getElementById("submitBtn");
    const result = document.getElementById("result");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      result.textContent = "";
      result.className = "";
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      const payload = {
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        reason: form.reason.value.trim(),
      };
      try {
        const response = await fetch("/api/data-deletion/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Unable to submit request");
        }
        form.reset();
        result.textContent = "Request submitted successfully. Reference ID: " + data.request_id;
        result.className = "ok";
      } catch (error) {
        result.textContent = error.message || "Something went wrong. Please try again.";
        result.className = "err";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request";
      }
    });
  </script>
</body>
</html>
"""

@app.get("/data-deletion", response_class=HTMLResponse)
async def data_deletion_page():
    return HTMLResponse(content=DATA_DELETION_PAGE_HTML)

@app.get("/account-deletion", response_class=HTMLResponse)
async def account_deletion_page():
    return HTMLResponse(content=DATA_DELETION_PAGE_HTML)

PRIVACY_POLICY_PAGE_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hercules Gym - Privacy Policy</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f6f8;
      --card: #ffffff;
      --text: #131313;
      --muted: #5a5a5a;
      --line: #d8d8d8;
      --brand: #0b3d91;
      --accent: #f6a800;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      background: linear-gradient(165deg, var(--bg), #edf1f5);
      color: var(--text);
      padding: 24px;
    }
    .card {
      max-width: 900px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .head {
      padding: 20px 24px;
      background: linear-gradient(110deg, var(--brand), #0f5ec7);
      color: #fff;
      border-bottom: 4px solid var(--accent);
    }
    .head h1 {
      margin: 0 0 6px;
      font-size: 24px;
      line-height: 1.25;
    }
    .head p {
      margin: 0;
      opacity: 0.95;
    }
    .body {
      padding: 22px 24px 26px;
      line-height: 1.6;
      font-size: 15px;
    }
    h2 {
      font-size: 18px;
      margin: 20px 0 8px;
      color: #102a54;
    }
    ul {
      margin: 8px 0 0 20px;
      padding: 0;
    }
    li { margin-bottom: 6px; }
    .note {
      margin-top: 14px;
      padding: 12px 14px;
      border: 1px solid #d8e7ff;
      border-radius: 10px;
      background: #f7fbff;
      color: #1b3762;
    }
    .muted {
      color: var(--muted);
      font-size: 13px;
      margin-top: 18px;
    }
    a { color: #0b53c1; }
  </style>
</head>
<body>
  <article class="card">
    <header class="head">
      <h1>Hercules Gym Privacy Policy</h1>
      <p>Effective date: 04 March 2026</p>
    </header>
    <section class="body">
      <p>
        Hercules Gym App ("we", "our", "us") is used by admins, trainers, and members to manage gym activities such as profile management, attendance, workouts, diets, notifications, announcements, and payment records.
      </p>

      <h2>Data We Collect</h2>
      <ul>
        <li>Account details: name, email, phone number, role, branch/center.</li>
        <li>Profile details: date of birth, profile photo, emergency/contact details when provided.</li>
        <li>Gym operations data: attendance check-in/check-out logs, workout plans, diet plans, announcements, achievements, and notifications.</li>
        <li>Payment records: membership and shop payment details, status, references, and uploaded proof screenshots when submitted.</li>
        <li>Technical data for reliability and security (for example authentication, API logs, and error diagnostics).</li>
      </ul>

      <h2>How We Use Data</h2>
      <ul>
        <li>To provide core app services and role-based access control.</li>
        <li>To manage approvals, attendance, reminders, and operational communication.</li>
        <li>To maintain account security and prevent abuse.</li>
        <li>To comply with legal and operational obligations.</li>
      </ul>

      <h2>Data Sharing</h2>
      <ul>
        <li>Data is visible only to authorized roles (admin/trainer/member) based on permission scope.</li>
        <li>We do not sell personal data.</li>
        <li>Limited service providers (for hosting/infrastructure) may process data on our behalf.</li>
      </ul>

      <h2>Retention</h2>
      <ul>
        <li>Active account data is retained while the account remains active.</li>
        <li>Some records may be retained for legitimate operational, legal, fraud-prevention, or backup purposes.</li>
      </ul>

      <h2>Account and Data Deletion</h2>
      <p>
        Users can request account and associated data deletion at:
        <a href="/data-deletion">/data-deletion</a>
      </p>
      <ul>
        <li>Primary account/profile data is deleted or irreversibly anonymized after verification.</li>
        <li>Certain records may be retained where required for legal, security, dispute, or compliance obligations.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        For privacy questions or requests, contact gym administration/support through your registered branch.
      </p>

      <div class="note">
        This policy may be updated from time to time. Material updates will be reflected on this page with a revised effective date.
      </div>
      <p class="muted">Hercules Gym App services - Fitness, Discipline, Progress.</p>
    </section>
  </article>
</body>
</html>
"""

@app.get("/privacy-policy", response_class=HTMLResponse)
async def privacy_policy_page():
    return HTMLResponse(content=PRIVACY_POLICY_PAGE_HTML)

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_page_alias():
    return HTMLResponse(content=PRIVACY_POLICY_PAGE_HTML)

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
        logger.warning("Continuing startup in degraded mode; database operations will retry on demand.")

    # Create indexes to reduce query latency on frequently used paths.
    try:
        await db.users.create_index([("id", 1)], unique=True)
        await db.users.create_index([("email", 1)], unique=True)
        await db.users.create_index([("phone", 1)])
        await db.users.create_index([("role", 1), ("center", 1)])
        await db.users.create_index([("date_of_birth", 1), ("is_active", 1), ("approval_status", 1)])
        await db.member_profiles.create_index([("user_id", 1)], unique=True)
        await db.member_profiles.create_index([("assigned_trainers", 1)])
        await db.password_reset_otps.create_index([("phone", 1)], unique=True)
        await db.password_reset_otps.create_index([("expires_at", 1)], expireAfterSeconds=0)
        await db.attendance.create_index([("user_id", 1), ("check_in_time", -1)])
        await db.attendance.create_index([("check_out_time", 1), ("check_in_time", 1)])
        await db.attendance.create_index([("center", 1), ("check_in_time", -1)])
        await db.qr_codes.create_index([("date", 1)], unique=True)
        await db.approval_requests.create_index([("status", 1), ("requested_at", -1)])
        await db.messages.create_index([("sender_id", 1), ("receiver_id", 1), ("created_at", 1)])
        await db.conversations.create_index([("participant_ids", 1), ("last_message_time", -1)])
        await db.payments.create_index([("member_id", 1), ("payment_type", 1), ("payment_date", -1)])
        await db.payments.create_index([("status", 1), ("center", 1), ("payment_date", -1)])
        await db.announcements.create_index([("is_active", 1), ("expires_at", -1), ("created_at", -1)])
        await db.app_settings.create_index([("key", 1)], unique=True)
        await db.data_deletion_requests.create_index([("id", 1)], unique=True)
        await db.data_deletion_requests.create_index([("status", 1), ("requested_at", -1)])
        await db.data_deletion_requests.create_index([("email", 1)])
        await db.data_deletion_requests.create_index([("phone", 1)])
        logger.info("MongoDB indexes ensured")
    except Exception as exc:
        logger.warning(f"Could not ensure one or more MongoDB indexes: {exc}")

    # Keep trainer-member assignment consistent per branch without delaying startup.
    async def _run_assignment_sync():
        try:
            await sync_all_branch_assignments()
            logger.info("Trainer-member branch assignments synchronized")
        except Exception as exc:
            logger.warning(f"Could not synchronize trainer-member assignments: {exc}")
    asyncio.create_task(_run_assignment_sync())

    async def _periodic_db_ping():
        interval_seconds = max(60, read_int_env("DB_KEEPALIVE_INTERVAL_SECONDS", 300))
        while True:
            try:
                await db.command("ping")
            except Exception as exc:
                logger.warning(f"Background DB keepalive ping failed: {exc}")
            await asyncio.sleep(interval_seconds)

    asyncio.create_task(_periodic_db_ping())

    async def _periodic_attendance_maintenance():
        finalize_interval = max(60, read_int_env("ATTENDANCE_FINALIZE_INTERVAL_SECONDS", 120))
        cleanup_interval = max(3600, read_int_env("ATTENDANCE_CLEANUP_INTERVAL_SECONDS", 86400))
        next_cleanup_at = datetime.utcnow()
        while True:
            try:
                finalized = await finalize_expired_attendance_sessions()
                if finalized:
                    logger.info(f"Auto checked-out {finalized} expired attendance sessions")
            except Exception as exc:
                logger.warning(f"Attendance auto-checkout task failed: {exc}")

            if datetime.utcnow() >= next_cleanup_at:
                try:
                    removed = await cleanup_expired_attendance_records()
                    if removed:
                        logger.info(f"Deleted {removed} attendance records older than {ATTENDANCE_RETENTION_DAYS} days")
                except Exception as exc:
                    logger.warning(f"Attendance cleanup task failed: {exc}")
                next_cleanup_at = datetime.utcnow() + timedelta(seconds=cleanup_interval)

            await asyncio.sleep(finalize_interval)

    asyncio.create_task(_periodic_attendance_maintenance())
    logger.info("Attendance maintenance background task started")

    # Start payment reminder background task
    asyncio.create_task(check_payment_reminders())
    logger.info("Payment reminder background task started")

    # Start birthday reminder background task
    asyncio.create_task(check_birthday_reminders())
    logger.info("Birthday reminder background task started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export socket app for uvicorn
app = socket_app
