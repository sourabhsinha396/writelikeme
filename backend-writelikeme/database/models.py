from sqlalchemy import Column, String, Integer, ForeignKey, Text, JSON, DateTime, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_social_auth = Column(Boolean, default=False)
    social_provider = Column(String, nullable=True)
    google_sub = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_superuser = Column(Boolean, default=False)
    
    style_profiles = relationship("StyleProfile", back_populates="user")
    generations = relationship("Generation", back_populates="user")
    consumption = relationship("Consumption", back_populates="user")
    payment_attempts = relationship("PaymentAttempt", back_populates="user")
    payments = relationship("PaymentHistory", back_populates="user")


class AnonymousUser(Base):
    __tablename__ = "anonymous_users"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(String, index=True)
    ip_address = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    style_profiles = relationship("StyleProfile", back_populates="anonymous_user")
    generations = relationship("Generation", back_populates="anonymous_user")
    consumption = relationship("Consumption", back_populates="anonymous_user")
    

class StyleProfile(Base):
    __tablename__ = "style_profiles"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    anonymous_user_id = Column(Integer, ForeignKey("anonymous_users.id"), nullable=True)
    name = Column(String, default="My Style")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    profile_data = Column(JSON)  # Store the full style profile as JSON
    is_common = Column(Boolean, default=False)
    user = relationship("User", back_populates="style_profiles")
    anonymous_user = relationship("AnonymousUser", back_populates="style_profiles")
    samples = relationship("Sample", back_populates="style_profile")
    generations = relationship("Generation", back_populates="style_profile")


class Sample(Base):
    __tablename__ = "samples"
    
    id = Column(Integer, primary_key=True)
    style_profile_id = Column(Integer, ForeignKey("style_profiles.id"))
    title = Column(String, default="Untitled")
    content = Column(Text)
    source_type = Column(String)  # "upload" or "paste"
    filename = Column(String, nullable=True)  # For uploaded files or sample name
    created_at = Column(DateTime, default=datetime.utcnow)
    style_profile = relationship("StyleProfile", back_populates="samples")


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True)
    title = Column(String, default="Untitled")
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    style_profile_id = Column(Integer, ForeignKey("style_profiles.id"))
    style_profile = relationship("StyleProfile", back_populates="generations")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="generations")
    anonymous_user_id = Column(Integer, ForeignKey("anonymous_users.id"), nullable=True)
    anonymous_user = relationship("AnonymousUser", back_populates="generations")
    consumption_id = Column(Integer, ForeignKey("consumption.id"), nullable=True)
    consumption = relationship("Consumption", back_populates="generations")


class Consumption(Base):
    __tablename__ = "consumption"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    anonymous_user_id = Column(Integer, ForeignKey("anonymous_users.id"), nullable=True)
    plan_id = Column(String)  # "free", "basic", "premium"
    word_limit = Column(Integer)
    words_used = Column(Integer, default=0)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    last_usage_date = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="consumption")
    anonymous_user = relationship("AnonymousUser", back_populates="consumption")
    generations = relationship("Generation", back_populates="consumption")
    
    def words_remaining(self):
        return max(0, self.word_limit - self.words_used)
    

class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    payment_id = Column(String, nullable=True)  # PayPal payment ID
    plan_id = Column(String)  # "basic", "premium"
    amount = Column(Float)
    status = Column(String)  # "initiated", "created", "completed", "failed", "canceled"
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)
    
    user = relationship("User", back_populates="payment_attempts")
    payment_history = relationship("PaymentHistory", back_populates="payment_attempt")


class PaymentHistory(Base):
    __tablename__ = "payment_history"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    payment_attempt_id = Column(Integer, ForeignKey("payment_attempts.id"))
    payment_id = Column(String)  # PayPal payment ID
    amount = Column(Float)
    status = Column(String)  # "completed", "refunded"
    plan_id = Column(String)  # "basic", "premium"
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="payments")
    payment_attempt = relationship("PaymentAttempt", back_populates="payment_history")