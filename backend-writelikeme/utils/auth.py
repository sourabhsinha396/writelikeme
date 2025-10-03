from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Union, Tuple
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
import uuid

from database.database import get_db
from database.models import User, AnonymousUser, StyleProfile

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against a provided password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Get the current authenticated user or None if not authenticated."""
    if not token:
        return None
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
        
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get a user by username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email."""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password."""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_or_create_anonymous_user(db: Session, session_id: str, ip_address: Optional[str] = None) -> AnonymousUser:
    """Get or create an anonymous user based on session ID with IP address as priority if available."""
    anonymous_user = None
    
    # First try to find by IP address if available
    if ip_address:
        anonymous_user = db.query(AnonymousUser).filter(AnonymousUser.ip_address == ip_address).first()
    
    # If not found by IP, try session ID
    if not anonymous_user and session_id:
        anonymous_user = db.query(AnonymousUser).filter(AnonymousUser.session_id == session_id).first()
    
    # If still not found, create a new anonymous user
    if not anonymous_user:
        anonymous_user = AnonymousUser(
            session_id=session_id,
            ip_address=ip_address
        )
        db.add(anonymous_user)
        db.commit()
        db.refresh(anonymous_user)
    elif ip_address and anonymous_user.ip_address != ip_address:
        # Update IP address if it has changed
        anonymous_user.ip_address = ip_address
        db.commit()
    
    return anonymous_user


def get_user_or_anonymous(
    request: Request, 
    db: Session,
    token: Optional[str] = None
) -> Tuple[Optional[User], Optional[AnonymousUser]]:
    """
    Get either an authenticated user or an anonymous user.
    Returns a tuple of (User, AnonymousUser) where one of them will be None.
    """
    # Check for authenticated user first via token
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user, None
        except JWTError:
            pass  # Token is invalid, continue as anonymous

    # For anonymous users, try IP address and session ID
    session_id = request.session.get("session_id")
    if not session_id:
        # Create a new session ID
        session_id = str(uuid.uuid4())
        request.session["session_id"] = session_id
    
    # Get client IP address
    ip_address = request.client.host if request.client else None
    
    # Get or create anonymous user
    anonymous_user = get_or_create_anonymous_user(db, session_id, ip_address)
    return None, anonymous_user


def transfer_profiles_to_user(db: Session, anonymous_user: AnonymousUser, user: User):
    """Transfer all style profiles from an anonymous user to an authenticated user."""
    # Get all profiles owned by the anonymous user
    profiles = db.query(StyleProfile).filter(StyleProfile.anonymous_user_id == anonymous_user.id).all()
    
    # Update each profile to belong to the authenticated user
    for profile in profiles:
        profile.user_id = user.id
        profile.anonymous_user_id = None
    
    db.commit()

    # Optionally, you can delete the anonymous user entry since it's no longer needed
    db.delete(anonymous_user)
    db.commit()