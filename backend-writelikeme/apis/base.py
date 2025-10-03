from fastapi import APIRouter
from apis.auth import router as auth_router
from apis.samples import router as samples_router
from apis.profiles import router as profiles_router
from apis.generate import router as generate_router
from apis.user import router as user_router    
from apis.payments import router as payments_router
from apis.social_auth import router as social_auth_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(social_auth_router, prefix="/auth")
api_router.include_router(samples_router, prefix="/samples")
api_router.include_router(profiles_router, prefix="/profiles")
api_router.include_router(generate_router, prefix="/generate")
api_router.include_router(user_router, prefix="/user")
api_router.include_router(payments_router, prefix="/payments")
