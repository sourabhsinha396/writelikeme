from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from authlib.integrations.starlette_client import OAuth
from authlib.oauth2.rfc6749 import OAuth2Token
from authlib.integrations.base_client import OAuthError
import os

from database.database import get_db
from database.models import User
from utils.auth import (
    create_access_token, 
    get_user_by_email,
    get_user_or_anonymous, 
    transfer_profiles_to_user
)
from utils.rate_limiter import limiter

# Environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL")
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 1 day

# Create OAuth instance
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "prompt": "consent"
    }
)

router = APIRouter(tags=["auth"])
slow_rate_limit = "5/minute"  # Adjust based on your constants


@router.get("/auth/google")
@limiter.limit(slow_rate_limit)
async def login_google(request: Request):
    """Initiate Google OAuth login flow"""
    # Generate the redirect URI dynamically based on the request
    redirect_uri = f"{request.base_url}auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def auth_google_callback(
    request: Request, 
    response: Response,
    db: Session = Depends(get_db),
    token: Optional[str] = None
):
    """Handle Google OAuth callback"""
    try:
        # Exchange authorization code for tokens
        token_response = await oauth.google.authorize_access_token(request)
        
        # Get user info from the token
        user_info = await oauth.google.parse_id_token(request, token_response)
        
        # Extract email from user info
        email = user_info.get("email")
        if not email:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Email not provided by Google"}
            )
        
        # Get or create user
        user = get_user_by_email(db, email)
        
        if not user:
            # Create a new user from Google profile data
            name = user_info.get('name', '').lower().replace(' ', '_') or email.split('@')[0]
            sub = user_info.get('sub')  # Google's unique identifier
            username = f"{name}_{sub[-6:]}"  # Append part of Google ID for uniqueness
            
            user = User(
                username=username,
                email=email,
                google_sub=sub,  # Store Google's unique ID - make sure this field exists in your User model
                hashed_password="",  # Empty for OAuth users
                is_social_auth=True,
                social_provider="google"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not hasattr(user, 'google_sub') or not user.google_sub:
            # Update existing user with Google sub if not set
            # Make sure your User model has these fields
            setattr(user, 'google_sub', user_info.get('sub'))
            setattr(user, 'is_social_auth', True)
            setattr(user, 'social_provider', 'google')
            db.commit()
            db.refresh(user)
        
        # Get current anonymous user if exists
        current_token = request.cookies.get("access_token")
        anonymous_user = None
        authenticated_user = None
        
        if current_token:
            authenticated_user, anonymous_user = get_user_or_anonymous(request, db, current_token)
        
        # If there was an anonymous user with profiles, transfer them to the authenticated user
        if anonymous_user and not authenticated_user:
            transfer_profiles_to_user(db, anonymous_user, user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id}, 
            expires_delta=access_token_expires
        )
        
        # Prepare redirect to frontend with successful authentication
        redirect_response = RedirectResponse(
            url=f"{FRONTEND_URL}/auth/success",
            status_code=status.HTTP_302_FOUND
        )
        
        # Set cookie for API authentication
        redirect_response.set_cookie(
            key="access_token",
            value=access_token,
            expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            secure=True,  # Set to True if serving over HTTPS
            samesite="none",  # Set SameSite attribute to "None" for cross-site cookies
            httponly=True, 
            path="/"  # Ensure cookie is sent to all paths
        )
        
        return redirect_response
        
    except OAuthError as e:
        # Handle OAuth specific errors
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/error?message={str(e)}",
            status_code=status.HTTP_302_FOUND
        )
    except Exception as e:
        # Handle other errors
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/error?message=Authentication+failed",
            status_code=status.HTTP_302_FOUND
        )