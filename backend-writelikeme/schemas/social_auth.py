from pydantic import BaseModel
from typing import Optional, Any, Dict


class GoogleUser(BaseModel):
    sub: str
    email: str
    name: str
    picture: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    
    # Allow extra fields to prevent validation errors
    model_config = {
        "extra": "ignore"
    }
    
    # Fallback for missing fields
    @classmethod
    def from_oauth_info(cls, user_info: Dict[str, Any]) -> "GoogleUser":
        """
        Create a GoogleUser from OAuth userinfo dictionary, 
        handling missing fields gracefully.
        """
        return cls(
            sub=user_info.get("sub", ""),
            email=user_info.get("email", ""),
            name=user_info.get("name", ""),
            picture=user_info.get("picture"),
            given_name=user_info.get("given_name"),
            family_name=user_info.get("family_name")
        )