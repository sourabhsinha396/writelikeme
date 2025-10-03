import os
import tempfile
from sqladmin import Admin
from typing import List, Optional
from fastapi import FastAPI, Request, File, UploadFile, Form, Depends, Cookie
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from database.database import engine
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database.database import get_db
from database.models import User, AnonymousUser, StyleProfile, Sample
from utils.style_analyzer import StyleAnalyzer
from utils.llm_integration import LLMIntegration
from utils.auth import get_user_or_anonymous
from apis.base import api_router
from utils.rate_limiter import limiter
from utils.admin_auth import AdminAuth
from admin.admin import UserAdmin, AnonymousUserAdmin, StyleProfileAdmin, SampleAdmin, GenerationAdmin, ConsumptionAdmin, PaymentAttemptAdmin, PaymentHistoryAdmin

load_dotenv()

app = FastAPI(title="Write Like Me", docs_url=None, redoc_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(api_router)
authentication_backend = AdminAuth(secret_key=os.getenv("SECRET_KEY"))
admin = Admin(app, engine, authentication_backend=authentication_backend)
templates = Jinja2Templates(directory="templates")

admin.add_view(UserAdmin)
admin.add_view(AnonymousUserAdmin)
admin.add_view(StyleProfileAdmin)
admin.add_view(SampleAdmin)
admin.add_view(GenerationAdmin)
admin.add_view(ConsumptionAdmin)
admin.add_view(PaymentAttemptAdmin)
admin.add_view(PaymentHistoryAdmin)


origins = [
    "http://localhost:3000",  # Next.js frontend on localhost
    "https://accounts.google.com",
    "https://writelikeme.io",
    "https://www.writelikeme.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "your-secret-key")
)


def get_template_context(request: Request, user: Optional[User] = None, anonymous_user: Optional[AnonymousUser] = None, **kwargs):
    context = {"request": request, **kwargs}
    
    if user:
        context["user"] = user
        context["is_authenticated"] = True
    else:
        context["is_authenticated"] = False
    
    return context


@app.get("/", response_class=HTMLResponse)
async def home(
    request: Request, 
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    user, anonymous_user = get_user_or_anonymous(request, db, token)
    return templates.TemplateResponse("index.html", get_template_context(request, user=user))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)