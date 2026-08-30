from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from google import genai
import os
import json
import re
from datetime import datetime
from database import db
from auth import get_current_user
from models import UserInDB

router = APIRouter(prefix="/ai", tags=["AI"])

def sanitize_input(text: str, max_length: int = 100) -> str:
    # Remove any characters that aren't alphanumeric, spaces, or basic punctuation
    sanitized = re.sub(r"[^a-zA-Z0-9\s.,\-\'\"]", "", str(text))
    return sanitized[:max_length].strip()

@router.post("/generate-plan")
async def generate_plan(payload: dict, current_user: UserInDB = Depends(get_current_user)):
    goal = payload.get("goal")
    level = payload.get("level")
    weight = payload.get("weight")
    
    if not all([goal, level, weight]):
        raise HTTPException(status_code=400, detail="Missing inputs")

    # 1. Prompt Injection Mitigation (Input Sanitization)
    sanitized_goal = sanitize_input(goal, max_length=150)
    sanitized_level = sanitize_input(level, max_length=50)
    sanitized_weight = sanitize_input(weight, max_length=10)
    
    if len(sanitized_goal) < 2 or len(sanitized_level) < 2:
        raise HTTPException(status_code=400, detail="Invalid inputs provided")

    # 2. Rate Limiting (Max 5 per day)
    now = datetime.utcnow()
    today_str = now.strftime("%Y-%m-%d")
    
    profile = await db.member_profiles.find_one({"user_id": current_user.id})
    if profile:
        rate_limit_data = profile.get("ai_rate_limit", {})
        if rate_limit_data.get("date") == today_str:
            if rate_limit_data.get("count", 0) >= 5:
                raise HTTPException(status_code=429, detail="Daily AI plan generation limit reached. Please try again tomorrow.")
            new_count = rate_limit_data.get("count", 0) + 1
        else:
            new_count = 1
    else:
        new_count = 1

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    Act as an elite personal trainer and nutritionist.
    User Profile:
    - Weight: {sanitized_weight} kg
    - Goal: {sanitized_goal}
    - Experience Level: {sanitized_level}
    
    Generate a JSON object containing two keys: "workout_plan" and "diet_plan".
    "workout_plan" should be a 4-week summary and schedule.
    "diet_plan" should be a daily meal plan (breakfast, lunch, dinner, snacks).
    Return ONLY valid JSON without markdown formatting.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text)
        
        # Save to MongoDB and update rate limit
        await db.member_profiles.update_one(
            {"user_id": current_user.id},
            {
                "$set": {
                    "ai_plan": data,
                    "ai_rate_limit": {"date": today_str, "count": new_count}
                }
            },
            upsert=True
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
