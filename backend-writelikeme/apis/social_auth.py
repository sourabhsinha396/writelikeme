import os
import random
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from authlib.oauth2.rfc6749 import OAuth2Token
from authlib.integrations.starlette_client import OAuth

from database.database import get_db
from utils.rate_limiter import limiter
from utils.constants import constants
from utils.auth import get_user_by_email, get_password_hash, create_access_token
from schemas.social_auth import GoogleUser
from database.models import User
from utils.notifier import send_slack_notification



router = APIRouter(tags=["social_auth"])
slow_rate_limit = constants.SLOW_RATE_LIMIT
FRONTEND_URL = os.getenv("FRONTEND_URL")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)


@router.get("/google/login")
@limiter.limit(slow_rate_limit)
async def google_login(request: Request):
    try:
        redirect_uri = GOOGLE_REDIRECT_URI
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        print(f"Google login error: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=Authentication%20failed:%20{str(e)}")


@router.get("/google/callback")
@limiter.limit(slow_rate_limit)
async def google_callback(request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        
        user_info = token.get('userinfo')
        if not user_info:
            user_info = await oauth.google.parse_id_token(request, token)
        
        user_data = GoogleUser(
            email=user_info.get('email', ''),
            name=user_info.get('name', ''),
            sub=user_info.get('sub', '')
        )
        
        if not user_data.email or not user_data.sub:
            raise ValueError("Missing required user information from Google")
        
        user = get_user_by_email(db, user_data.email)
        
        if user:
            user.social_provider = 'google'
            user.google_sub = user_data.sub
            db.commit()
            db.refresh(user)
        else:
            try:
                user = User(
                    email=user_data.email,
                    username=user_data.name.lower().replace(" ", "-") + str(random.randint(1, 9999)),
                    hashed_password=get_password_hash(user_data.sub),
                    social_provider='google',
                    google_sub=user_data.sub
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception as user_create_error:
                print(f"Error creating user: {user_create_error}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=Authentication%20failed:%20{str(user_create_error)}")
            
        access_token = create_access_token(data={'sub': str(user.id)})
        
        response = RedirectResponse(url=f"{FRONTEND_URL}/profiles")
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite="none",
            secure=True,
            max_age=30 * 24 * 60 * 60,
        )
        send_slack_notification(f"User {user.username} logged in with Google")
        return response
        
    except Exception as e:
        print(f"Google callback error: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=Authentication%20failed:%20{str(e)}")