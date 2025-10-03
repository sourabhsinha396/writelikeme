from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True


class AnonymousUserBase(BaseModel):
    session_id: Optional[str] = None
    ip_address: Optional[str] = None


class AnonymousUserCreate(AnonymousUserBase):
    pass


class AnonymousUser(AnonymousUserBase):
    id: str
    created_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True