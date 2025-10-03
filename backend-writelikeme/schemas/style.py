from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class SampleBase(BaseModel):
    content: str
    source_type: str  # "upload" or "paste"
    filename: Optional[str] = None


class SampleCreate(SampleBase):
    pass


class Sample(SampleBase):
    id: str
    style_profile_id: str
    created_at: datetime
    
    class Config:
        orm_mode = True


class StyleProfileBase(BaseModel):
    name: Optional[str] = "My Style"


class StyleProfileCreate(StyleProfileBase):
    pass


class StyleProfile(StyleProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    profile_data: Dict[str, Any]
    samples: List[Sample] = []
    
    class Config:
        orm_mode = True


class GenerationRequest(BaseModel):
    profile_id: str
    topic: str
    length: Optional[str] = "medium"