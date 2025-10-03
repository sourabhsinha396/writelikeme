from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request, Response, Form, Cookie
from fastapi.responses import JSONResponse
from database.models import User, AnonymousUser
from database.database import get_db
from utils.auth import get_user_by_username, get_user_by_email, get_user_or_anonymous, authenticate_user, transfer_profiles_to_user
from utils.auth import create_access_token, get_password_hash
from utils.constants import constants
from utils.rate_limiter import limiter
from utils.notifier import send_slack_notification


router = APIRouter(tags=["auth"])
slow_rate_limit = constants.SLOW_RATE_LIMIT

# Increase token expiration to 1 day (24 hours) for better user experience
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60


@router.post("/login")
@limiter.limit(slow_rate_limit)
async def login_api(
    request: Request,
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    # Authenticate user
    user = authenticate_user(db, username, password)
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "Invalid username or password"}
        )
    
    # Get anonymous user data before login
    _, anonymous_user = get_user_or_anonymous(request, db, token)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, 
        expires_delta=access_token_expires
    )
    
    # If there was an anonymous user with profiles, transfer them to the authenticated user
    if anonymous_user:
        transfer_profiles_to_user(db, anonymous_user, user)
    
    send_slack_notification(f"User {user.username} logged in")
    # Set cookie with token
    response = JSONResponse(content={
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })
    
    # Standard cookie settings for development
    response.set_cookie(
        key="access_token",
        value=access_token,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=True,  # Set to True if serving over HTTPS
        samesite="none",  # Set SameSite attribute to "None" for cross-site cookies
        httponly=True, 
        path="/" # Ensure cookie is sent to all paths
    )
    
    return response


@router.post("/signup")
@limiter.limit(slow_rate_limit)
async def signup_api(
    request: Request,
    response: Response,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    # Validate input
    if password != confirm_password:
        return JSONResponse(
            status_code=400,
            content={"error": "Passwords do not match"}
        )
    
    if len(password) < 8:
        return JSONResponse(
            status_code=400,
            content={"error": "Password must be at least 8 characters"}
        )
    
    # Check if username or email already exists
    if get_user_by_username(db, username):
        return JSONResponse(
            status_code=400,
            content={"error": "Username already exists"}
        )
    
    if get_user_by_email(db, email):
        return JSONResponse(
            status_code=400,
            content={"error": "Email already exists"}
        )
    
    # Get current anonymous user if exists
    _, anonymous_user = get_user_or_anonymous(request, db, token)
    
    # Create new user
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # If there was an anonymous user with profiles, transfer them to the new user
    if anonymous_user:
        transfer_profiles_to_user(db, anonymous_user, user)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, 
        expires_delta=access_token_expires
    )
    
    send_slack_notification(f"User {user.username} signed up")
    # Set cookie with token
    response = JSONResponse(content={
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=True,
        samesite="none",
        httponly=True, 
        path="/"
    )
    
    return response


@router.get("/logout")
@limiter.limit(slow_rate_limit)
async def logout_api(request: Request, response: Response):
    response = JSONResponse(content={"success": True})
    # Use same cookie settings for deletion
    response.delete_cookie(
        key="access_token", 
        path="/",
        samesite="none",
        secure=True,
        httponly=True
    )
    return response

    