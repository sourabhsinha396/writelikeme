from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from database.models import User, AnonymousUser, Consumption, Generation
from fastapi import HTTPException, Request, Response, Cookie

# Define payment plans (match with payments.py)
PAYMENT_PLANS = {
    "free": {
        "name": "Free Tier",
        "price": 0,
        "word_limit": 1500,
        "features": ["Basic style analysis", "Limited generations"]
    },
    "basic": {
        "name": "Basic Tier",
        "price": 5,
        "word_limit": 6000,
        "features": ["Advanced style analysis", "More generations", "Priority support"]
    },
    "premium": {
        "name": "Premium Tier",
        "price": 20,
        "word_limit": 50000,
        "features": ["Comprehensive style analysis", "Unlimited generations", "Priority support", "Custom styles"]
    }
}


def get_anonymous_user_active_plan(db: Session, anonymous_user: AnonymousUser) -> Optional[Consumption]:
    consumption = db.query(Consumption).filter(
        Consumption.anonymous_user_id == anonymous_user.id,
        Consumption.words_used < Consumption.word_limit
    ).order_by(Consumption.purchase_date.desc()).first()

    if not consumption:
        consumption = Consumption(
            anonymous_user_id=anonymous_user.id,
            plan_id="free",
            word_limit=PAYMENT_PLANS["free"]["word_limit"],
            words_used=0,
            purchase_date=datetime.utcnow()
        )
        db.add(consumption)
        db.commit()
        db.refresh(consumption)
    
    return consumption


def get_user_active_plan(db: Session, user: User) -> Optional[Consumption]:
    """Get active consumption plan for user"""
    if not user:
        return None
    
    # Get active consumption from database (most recent plan with remaining words)
    consumption = db.query(Consumption).filter(
        Consumption.user_id == user.id,
        Consumption.words_used < Consumption.word_limit
    ).order_by(Consumption.purchase_date.desc()).first()
    
    # Return found consumption if it exists
    if consumption:
        return consumption
    
    # If no consumption with remaining words, create a free tier plan
    free_plan = Consumption(
        user_id=user.id,
        plan_id="free",
        word_limit=PAYMENT_PLANS["free"]["word_limit"],
        words_used=0,
        purchase_date=datetime.utcnow()
    )
    db.add(free_plan)
    db.commit()
    db.refresh(free_plan)
    
    return free_plan


def track_word_usage_for_anonymous_user(db: Session, anonymous_user: AnonymousUser, generation: Generation, word_count: int) -> Tuple[bool, str]:
    if not anonymous_user:
        return False, "User not authenticated"
    
    consumption = get_anonymous_user_active_plan(db, anonymous_user)

    if not consumption:
        consumption = Consumption(
            anonymous_user_id=anonymous_user.id,
            plan_id="free",
            word_limit=PAYMENT_PLANS["free"]["word_limit"],
            words_used=0,
            purchase_date=datetime.utcnow()
        )
        db.add(consumption)
        db.commit()
        db.refresh(consumption)
    
    consumption.words_used += word_count
    consumption.last_usage_date = datetime.utcnow()
    db.commit()
    db.refresh(consumption)
    return {"tracked": True, "message": "Usage tracked successfully", "consumption": consumption}


def track_word_usage(db: Session, user: User, generation: Generation, word_count: int) -> Tuple[bool, str]:
    """
    Track word usage and return whether the operation is allowed
    Returns: (is_allowed, message)
    """
    if not user:
        return False, "User not authenticated"
    
    # Get user consumption plan
    consumption = get_user_active_plan(db, user)
    
    # Check if usage would exceed limits
    if consumption.words_used + word_count > consumption.word_limit:
        return False, f"Word limit exceeded. You have {consumption.words_remaining()} words remaining in your plan."
    
    # Update consumption usage
    consumption.words_used += word_count
    consumption.last_usage_date = datetime.utcnow()
    
    # Link generation to consumption
    generation.consumption_id = consumption.id
    
    db.commit()
    
    return {"tracked": True, "message": "Usage tracked successfully", "consumption": consumption}


def count_words(text: str) -> int:
    """Count words in text"""
    return len(text.split())


def can_generate_content(db: Session, any_of_user_or_anonymous: User | AnonymousUser, estimated_words: int = 500) -> Tuple[bool, str, Optional[Consumption]]:
    if not any_of_user_or_anonymous:
        return {"allowed": False, "message": "User not authenticated", "consumption": None}
    
    is_user = isinstance(any_of_user_or_anonymous, User)
    consumption = get_user_active_plan(db, any_of_user_or_anonymous) if is_user else get_anonymous_user_active_plan(db, any_of_user_or_anonymous)
    if consumption.words_used + estimated_words > consumption.word_limit:
        return {"allowed": False, "message": f"Word limit would be exceeded. You have {consumption.words_remaining()} words remaining.", "consumption": consumption}
    
    return {"allowed": True, "message": "Generation allowed", "consumption": consumption}


def get_plan_features(consumption: Consumption) -> dict:
    """Get consumption plan features and limits"""
    plan_id = consumption.plan_id if consumption else "free"
    
    plan_data = PAYMENT_PLANS.get(plan_id, PAYMENT_PLANS["free"])
    
    result = {
        "plan_id": plan_id,
        "plan_name": plan_data["name"],
        "word_limit": plan_data["word_limit"],
        "features": plan_data["features"],
    }
    
    if consumption:
        result.update({
            "words_used": consumption.words_used,
            "words_remaining": consumption.words_remaining(),
            "purchase_date": consumption.purchase_date.isoformat() if consumption.purchase_date else None,
            "last_usage_date": consumption.last_usage_date.isoformat() if consumption.last_usage_date else None
        })
    
    return result


def get_user_usage_stats(db: Session, user: User) -> dict:
    """Get usage statistics for user"""
    if not user:
        return {}
    
    # Get all consumption plans for the user
    plans = db.query(Consumption).filter(
        Consumption.user_id == user.id
    ).all()
    
    # Calculate total words used and total words purchased
    total_words_used = sum(plan.words_used for plan in plans)
    total_words_purchased = sum(plan.word_limit for plan in plans)
    
    # Get most recent active plan
    active_plan = get_user_active_plan(db, user)
    
    # Calculate words remaining in active plan
    words_remaining = active_plan.words_remaining() if active_plan else 0
    
    # Get usage by month
    current_month = datetime.utcnow().month
    current_year = datetime.utcnow().year
    
    # Get generations for current month
    generations = db.query(Generation).filter(
        Generation.user_id == user.id,
        db.extract('year', Generation.created_at) == current_year,
        db.extract('month', Generation.created_at) == current_month
    ).all()
    
    # Count total words in current month
    current_month_usage = sum(count_words(gen.content) for gen in generations)
    
    return {
        "total_words_used": total_words_used,
        "total_words_purchased": total_words_purchased,
        "words_remaining": words_remaining,
        "current_month_usage": current_month_usage,
        "active_plan": get_plan_features(active_plan),
        "generation_count": len(generations)
    }


def get_all_user_plans(db: Session, user: User) -> list:
    """Get all user consumption plans with usage statistics"""
    if not user:
        return []
    
    # Get all user consumption plans
    consumption_plans = db.query(Consumption).filter(
        Consumption.user_id == user.id
    ).order_by(Consumption.purchase_date.desc()).all()
    
    result = []
    for plan in consumption_plans:
        plan_data = PAYMENT_PLANS.get(plan.plan_id, {})
        result.append({
            "id": plan.id,
            "plan_id": plan.plan_id,
            "plan_name": plan_data.get("name", "Unknown Plan"),
            "word_limit": plan.word_limit,
            "words_used": plan.words_used,
            "words_remaining": plan.words_remaining(),
            "purchase_date": plan.purchase_date.isoformat(),
            "last_usage_date": plan.last_usage_date.isoformat() if plan.last_usage_date else None,
            "is_active": plan.words_remaining() > 0
        })
    
    return result