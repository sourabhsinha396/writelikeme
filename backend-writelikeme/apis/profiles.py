from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request, Cookie
from fastapi.responses import JSONResponse
from database.models import StyleProfile, Sample
from database.database import get_db
from utils.auth import get_user_or_anonymous
from utils.rate_limiter import limiter
from utils.constants import constants

router = APIRouter(tags=["profiles"])
medium_rate_limit = constants.MEDIUM_RATE_LIMIT


@router.get("")
@limiter.limit(medium_rate_limit)
async def get_profiles(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    user, anonymous_user = get_user_or_anonymous(request, db, token)
    
    if not user and not anonymous_user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    
    profiles = []
    
    if user:
        user_profiles = db.query(StyleProfile).filter(StyleProfile.user_id == user.id).all()
        common_profiles = db.query(StyleProfile).filter(StyleProfile.is_common == True).all()
        profiles.extend(user_profiles)
        profiles.extend(common_profiles)
    
    if anonymous_user:
        anon_profiles = db.query(StyleProfile).filter(StyleProfile.anonymous_user_id == anonymous_user.id).all()
        common_profiles = db.query(StyleProfile).filter(StyleProfile.is_common == True).all()
        profiles.extend(anon_profiles)
        profiles.extend(common_profiles)
    
    # Format profiles for response
    profiles_data = []
    for profile in set(profiles):
        sample_count = db.query(Sample).filter(Sample.style_profile_id == profile.id).count()
        profiles_data.append({
            "id": profile.id,
            "name": profile.name,
            "created_at": profile.created_at.isoformat(),
            "sample_count": sample_count
        })
    
    return JSONResponse(content={"profiles": profiles_data})



@router.get("/create-common-profile")
@limiter.limit(medium_rate_limit)
async def create_common_profile(
    request: Request,
    style_profile_id: str,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    user, anonymous_user = get_user_or_anonymous(request, db, token)
    
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    
    if not user.is_superuser:
        return JSONResponse(status_code=403, content={"error": "You don't have access to this profile"})
    
    print(f"style_profile_id: {style_profile_id}")
    style_profile = db.query(StyleProfile).filter(StyleProfile.id == style_profile_id).first()
    if not style_profile:
        return JSONResponse(status_code=404, content={"error": "Profile not found"})
    
    style_profile.is_common = True
    db.commit()
    db.refresh(style_profile)
    return JSONResponse(status_code=200, content={"message": "Profile marked as common"})


@router.get("/{profile_id}")
@limiter.limit(medium_rate_limit)
async def get_profile_api(
    request: Request, 
    profile_id: str,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    user, anonymous_user = get_user_or_anonymous(request, db, token)

    
    # Check if profile exists
    style_profile = db.query(StyleProfile).filter(StyleProfile.id == profile_id).first()
    is_common = style_profile.is_common

    if not style_profile:
        return JSONResponse(
            status_code=404,
            content={"error": "Profile not found"}
        )
    
    # Check if the profile belongs to the user/anonymous user
    profile_belongs_to_user = False
    
    if user and style_profile.user_id == user.id:
        profile_belongs_to_user = True
    elif anonymous_user and style_profile.anonymous_user_id == anonymous_user.id:
        profile_belongs_to_user = True

    if not profile_belongs_to_user and is_common:
        return JSONResponse(
            status_code=403,
            content={"error": "Default profiles are not editable"}
        )
    
    if not profile_belongs_to_user:
        return JSONResponse(
            status_code=403,
            content={"error": "You don't have access to this profile"}
        )
    
    # Get samples
    samples = db.query(Sample).filter(Sample.style_profile_id == profile_id).all()
    samples_data = [{
        "id": sample.id,
        "filename": sample.filename,
        "source_type": sample.source_type,
        "created_at": sample.created_at.isoformat()
    } for sample in samples]
    
    return JSONResponse(content={
        "profile": {
            "id": style_profile.id,
            "name": style_profile.name,
            "created_at": style_profile.created_at.isoformat(),
            "profile_data": style_profile.profile_data
        },
        "samples": samples_data
    })