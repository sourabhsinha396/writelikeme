from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import JSONResponse, RedirectResponse
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import User, Consumption, PaymentHistory, PaymentAttempt
from utils.auth import get_user_or_anonymous
from datetime import datetime
import os
import paypalrestsdk
from dotenv import load_dotenv
from fastapi import Cookie
from utils.constants import constants
from utils.rate_limiter import limiter
from utils.notifier import send_slack_notification


load_dotenv()
medium_rate_limit = constants.MEDIUM_RATE_LIMIT
slow_rate_limit = constants.SLOW_RATE_LIMIT

paypalrestsdk.configure({
    "mode": os.getenv("PAYPAL_MODE", "sandbox"),
    "client_id": os.getenv("PAYPAL_CLIENT_ID"),
    "client_secret": os.getenv("PAYPAL_CLIENT_SECRET")
})

router = APIRouter(tags=["payments"])


@router.get("/plans")
@limiter.limit(medium_rate_limit)
async def get_payment_plans(request: Request):
    """Get all available payment plans"""
    return JSONResponse(content={"plans": constants.PAYMENT_PLANS})


@router.post("/create-paypal-order")
@limiter.limit(slow_rate_limit)
async def create_paypal_order(
    request: Request,
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    """Create a PayPal order and return the order ID"""
    user, _ = get_user_or_anonymous(request, db, token)
    
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "You must be logged in to make a purchase"}
        )
    
    plan_id = data.get("plan_id")
    
    if not plan_id or plan_id not in constants.PAYMENT_PLANS or plan_id == "free":
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid payment plan"}
        )
    
    plan = constants.PAYMENT_PLANS[plan_id]
    amount = data.get("amount", plan["price"])
    
    # Create a payment attempt record
    payment_attempt = PaymentAttempt(
        user_id=user.id,
        plan_id=plan_id,
        amount=amount,
        status="initiated"
    )
    db.add(payment_attempt)
    db.commit()
    db.refresh(payment_attempt)
    
    try:
        # Create PayPal payment with correct backend URL
        backend_url = os.getenv('BACKEND_URL', 'http://127.0.0.1:8000')
        print(f"Backend URL: {backend_url}")
        
        # Use the backend URL for the API processing, not the frontend
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"{backend_url}/api/payments/execute-payment?attempt_id={payment_attempt.id}",
                "cancel_url": f"{backend_url}/api/payments/cancel-payment?attempt_id={payment_attempt.id}"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": plan["name"],
                        "sku": plan_id,
                        "price": str(amount),
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": str(amount),
                    "currency": "USD"
                },
                "description": f"StyleMimic {plan['name']} - {plan['word_limit']} words"
            }]
        })
        
        if payment.create():
            # Update the payment attempt with the PayPal payment ID
            payment_attempt.payment_id = payment.id
            payment_attempt.status = "created"
            db.commit()
            
            # Extract the EC token from the approval_url
            approval_url = ""
            token = ""
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    # Extract the EC-XXX token from the URL
                    if "token=EC-" in link.href:
                        token = link.href.split("token=EC-", 1)[1]
                    break
            
            send_slack_notification(f"User {user.username} created a PayPal payment for {amount} USD")
            return JSONResponse(content={
                "success": True,
                "id": token,  
                "orderId": payment.id,
                "redirect_url": approval_url
            })
        else:
            # Payment creation failed
            payment_attempt.status = "failed"
            payment_attempt.error_message = str(payment.error)
            db.commit()
            
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to create PayPal payment", "details": payment.error}
            )
    except Exception as e:
        # Error creating payment
        payment_attempt.status = "failed"
        payment_attempt.error_message = str(e)
        db.commit()
        
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to create PayPal payment", "details": str(e)}
        )


@router.get("/cancel-payment")
async def cancel_payment(
    request: Request,
    attempt_id: str,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    """Handle canceled PayPal payments"""
    user, _ = get_user_or_anonymous(request, db, token)
    
    if not user:
        return RedirectResponse(url="/login?error=login_required")
    
    # Update payment attempt as canceled
    payment_attempt = db.query(PaymentAttempt).filter(
        PaymentAttempt.id == attempt_id,
        PaymentAttempt.user_id == user.id
    ).first()
    
    if payment_attempt:
        payment_attempt.status = "canceled"
        db.commit()
    
    send_slack_notification(f"User {user.username} canceled a PayPal payment")
    return RedirectResponse(url="/pricing?error=payment_canceled")


@router.get("/my-plan")
@limiter.limit(medium_rate_limit)
async def get_my_plan(
    request: Request, 
    db: Session = Depends(get_db), 
    token: Optional[str] = Cookie(None, alias="access_token")
):
    """Get current user's plan details and usage"""
    user, _ = get_user_or_anonymous(request, db, token)
    
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    consumption = db.query(Consumption).filter(
        Consumption.user_id == user.id,
        Consumption.words_used < Consumption.word_limit
    ).order_by(Consumption.purchase_date.desc()).first()
    
    if not consumption:
        return JSONResponse(content={
            "plan": {
                "plan_id": "free",
                "plan_name": constants.PAYMENT_PLANS["free"]["name"],
                "word_limit": constants.PAYMENT_PLANS["free"]["word_limit"],
                "words_used": 0,
                "words_remaining": constants.PAYMENT_PLANS["free"]["word_limit"],
                "purchase_date": None,
                "features": constants.PAYMENT_PLANS["free"]["features"]
            }
        })
    
    # Calculate words remaining
    words_remaining = max(0, consumption.word_limit - consumption.words_used)
    
    return JSONResponse(content={
        "plan": {
            "plan_id": consumption.plan_id,
            "plan_name": constants.PAYMENT_PLANS[consumption.plan_id]["name"],
            "word_limit": consumption.word_limit,
            "words_used": consumption.words_used,
            "words_remaining": words_remaining,
            "purchase_date": consumption.purchase_date.isoformat(),
            "features": constants.PAYMENT_PLANS[consumption.plan_id]["features"]
        }
    })


@router.get("/payment-history")
@limiter.limit(medium_rate_limit)
async def get_payment_history(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    """Get user's payment history"""
    user, _ = get_user_or_anonymous(request, db, token)
    
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    payments = db.query(PaymentHistory).filter(
        PaymentHistory.user_id == user.id
    ).order_by(PaymentHistory.created_at.desc()).all()
    
    payment_history = []
    for payment in payments:
        plan_info = constants.PAYMENT_PLANS.get(payment.plan_id, {})
        payment_history.append({
            "id": payment.id,
            "payment_id": payment.payment_id,
            "amount": payment.amount,
            "status": payment.status,
            "plan_id": payment.plan_id,
            "plan_name": plan_info.get("name", "Unknown Plan"),
            "created_at": payment.created_at.isoformat(),
            "completed_at": payment.completed_at.isoformat() if payment.completed_at else None
        })
    
    return JSONResponse(content={"payment_history": payment_history})


@router.post("/direct-execute")
@limiter.limit(slow_rate_limit)
async def direct_execute_payment(
    request: Request,
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    """Directly execute a PayPal payment without relying on redirects"""
    user, _ = get_user_or_anonymous(request, db, token)
    
    if not user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    payment_id = data.get("payment_id")
    payer_id = data.get("payer_id")
    
    if not payment_id or not payer_id:
        return JSONResponse(
            status_code=400,
            content={"error": "Missing payment_id or payer_id"}
        )
    
    # Find the payment attempt
    payment_attempt = db.query(PaymentAttempt).filter(
        PaymentAttempt.payment_id == payment_id,
        PaymentAttempt.user_id == user.id
    ).first()
    
    if not payment_attempt:
        return JSONResponse(
            status_code=404,
            content={"error": "Payment attempt not found"}
        )
    
    try:
        # Find the payment in PayPal
        payment = paypalrestsdk.Payment.find(payment_id)
        
        # Log payment state for debugging
        print(f"Payment state before execution: {payment.state}")
        
        # Execute the payment
        if payment.execute({"payer_id": payer_id}):
            print("Payment executed successfully")
            
            # Update payment attempt
            payment_attempt.status = "completed"
            payment_attempt.completed_at = datetime.utcnow()
            
            # Create consumption record
            plan = constants.PAYMENT_PLANS[payment_attempt.plan_id]
            consumption = Consumption(
                user_id=user.id,
                plan_id=payment_attempt.plan_id,
                word_limit=plan["word_limit"],
                words_used=0,
                purchase_date=datetime.utcnow()
            )
            db.add(consumption)
            
            # Create payment history record
            payment_history = PaymentHistory(
                user_id=user.id,
                payment_attempt_id=payment_attempt.id,
                payment_id=payment_id,
                amount=payment_attempt.amount,
                status="completed",
                plan_id=payment_attempt.plan_id
            )
            db.add(payment_history)
            
            db.commit()
            
            send_slack_notification(f"User {user.username} completed a PayPal payment for {payment_attempt.amount} USD")
            return JSONResponse(content={
                "success": True,
                "plan_id": payment_attempt.plan_id,
                "plan_name": plan["name"],
                "word_limit": plan["word_limit"]
            })
        else:
            # Payment execution failed
            print(f"Payment execution failed: {payment.error}")
            payment_attempt.status = "failed"
            payment_attempt.error_message = str(payment.error)
            db.commit()
            
            send_slack_notification(f"User {user.username} failed to execute a payment for {payment_attempt.amount} USD")
            return JSONResponse(
                status_code=400,
                content={"error": "Failed to execute payment", "details": payment.error}
            )
    except Exception as e:
        # Log the error
        print(f"Error executing payment: {str(e)}")
        payment_attempt.status = "error"
        payment_attempt.error_message = str(e)
        db.commit()
        
        send_slack_notification(f"Exception in executing payment: {str(e)} for user {user.username}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to execute payment: {str(e)}"}
        )