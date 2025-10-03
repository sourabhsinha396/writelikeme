import os
from fastapi import Request
from sqladmin.authentication import AuthenticationBackend
from database.database import get_db
from database.models import User


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        
        # Validate credentials against your database
        db = next(get_db())
        if username == os.getenv("ADMIN_USERNAME") and password == os.getenv("ADMIN_PASSWORD"):
            request.session["admin_authenticated"] = True
            return True
        return False
    
    async def authenticate(self, request: Request) -> bool:
        return request.session.get("admin_authenticated", False)
        
    async def logout(self, request: Request) -> bool:
        if "admin_authenticated" in request.session:
            del request.session["admin_authenticated"]
        return True
