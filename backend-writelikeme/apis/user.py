from fastapi import APIRouter, Depends, Request, Cookie
from typing import Optional
from sqlalchemy.orm import Session
from database.database import get_db
from utils.auth import get_user_or_anonymous
from fastapi.responses import JSONResponse
from utils.constants import constants
from utils.rate_limiter import limiter

router = APIRouter(tags=["user"])
medium_rate_limit = constants.MEDIUM_RATE_LIMIT


@router.get("/me")
@limiter.limit(medium_rate_limit)
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    user, anonymous_user = get_user_or_anonymous(request, db, token)
    
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    # If user is anonymous, return different response
    if anonymous_user:
        return {
            "user": None,
            "anonymous": True,
            "anonymous_id": anonymous_user.id
        }
    
    # If user is logged in, return user data
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }