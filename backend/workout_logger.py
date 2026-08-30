from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from .database import db
from .auth import get_current_user
from .models import UserInDB

router = APIRouter(prefix="/workout-logs", tags=["Workouts"])

class WorkoutLogItem(BaseModel):
    exercise: str
    sets: int
    reps: int
    weight: float

class WorkoutLogCreate(BaseModel):
    items: List[WorkoutLogItem]

@router.post("")
async def create_workout_log(log: WorkoutLogCreate, current_user: UserInDB = Depends(get_current_user)):
    now = datetime.utcnow()
    doc = {
        "id": uuid.uuid4().hex,
        "user_id": current_user.id,
        "date": now,
        "items": [item.dict() for item in log.items]
    }
    await db.workout_logs.insert_one(doc)
    return {"status": "success", "id": doc["id"]}

@router.get("")
async def get_workout_logs(current_user: UserInDB = Depends(get_current_user)):
    cursor = db.workout_logs.find({"user_id": current_user.id}).sort("date", -1)
    logs = await cursor.to_list(length=100)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs
