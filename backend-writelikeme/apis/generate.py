from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request, Form, Cookie
from fastapi.responses import JSONResponse, StreamingResponse
import asyncio
from database.models import StyleProfile, Generation
from database.database import get_db
from utils.auth import get_user_or_anonymous
from utils.llm_integration import LLMIntegration
from utils.payment_utils import can_generate_content, track_word_usage, count_words, track_word_usage_for_anonymous_user
from utils.constants import constants
from utils.rate_limiter import limiter
from utils.notifier import send_slack_notification

router = APIRouter(tags=["generate"])   
slow_rate_limit = constants.SLOW_RATE_LIMIT


@router.post("")
@limiter.limit(slow_rate_limit)
async def generate_content_api(
    request: Request,
    profile_id: str = Form(...),
    topic: str = Form(...),
    length: str = Form("medium"),
    stream: bool = Form(False),
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(None, alias="access_token")
):
    user, anonymous_user = get_user_or_anonymous(request, db, token)
    any_of_user_or_anonymous = user or anonymous_user
    if any_of_user_or_anonymous:
        estimated_words = {
            "short": 300,
            "medium": 600,
            "long": 1200
        }.get(length, 600)
        
        can_generate_result = can_generate_content(db, any_of_user_or_anonymous, estimated_words)
        if not can_generate_result["allowed"]:
            return JSONResponse(
                status_code=402,
                content={
                    "error": can_generate_result["message"],
                    "current_plan": can_generate_result["consumption"].plan_id if can_generate_result["consumption"] else "free"
                }
            )
    
    style_profile = db.query(StyleProfile).filter(StyleProfile.id == profile_id).first()
    if not style_profile:
        return JSONResponse(
            status_code=404,
            content={"error": "Profile not found"}
        )
    
    profile_belongs_to_user = False
    if style_profile.is_common:
        profile_belongs_to_user = True
    elif user and style_profile.user_id == user.id:
        profile_belongs_to_user = True
    elif anonymous_user and style_profile.anonymous_user_id == anonymous_user.id:
        profile_belongs_to_user = True
        
    if not profile_belongs_to_user:
        return JSONResponse(
            status_code=403,
            content={"error": "You don't have access to this profile"}
        )
    
    try:
        if stream:
            async def content_stream():
                full_content = ""
                
                llm = LLMIntegration()
                streaming_response = llm.generate_content(
                    style_profile=style_profile.profile_data,
                    topic=topic,
                    length=length,
                    stream=True
                )
                
                # Stream chunks as they arrive
                for chunk in streaming_response:
                    try:
                        content = chunk.choices[0].delta.content
                        if content:
                            full_content += content
                            # Format as SSE (Server-Sent Events)
                            yield f"data: {content}\n\n"
                            
                        # Small delay to avoid overwhelming the client
                        await asyncio.sleep(0.01)
                    except Exception as e:
                        print(f"Error processing chunk: {str(e)}")
                        continue
                
                # After streaming completes, save the generation to database
                generation = Generation(
                    title=topic,
                    content=full_content,
                    style_profile_id=style_profile.id
                )
                
                if user:
                    generation.user_id = user.id
                    actual_word_count = count_words(full_content)
                    word_usage_result = track_word_usage(db, user, generation, actual_word_count)
                    if word_usage_result["tracked"]:
                        generation.consumption_id = word_usage_result["consumption"].id
                
                if anonymous_user:
                    generation.anonymous_user_id = anonymous_user.id
                    actual_word_count = count_words(full_content)
                    word_usage_result = track_word_usage_for_anonymous_user(db, anonymous_user, generation, actual_word_count)
                    if word_usage_result["tracked"]:
                        generation.consumption_id = word_usage_result["consumption"].id

                
                db.add(generation)
                db.commit()
                
                # Send end marker
                yield "data: [DONE]\n\n"
            
            # Return a streaming response
            return StreamingResponse(
                content_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Content-Type": "text/event-stream",
                    "X-Accel-Buffering": "no",  # Disable nginx buffering
                }
            )
        else:
            # Original non-streaming behavior
            generated_content = LLMIntegration().generate_content(
                style_profile=style_profile.profile_data,
                topic=topic,
                length=length
            )
            
            # Create a generation record
            generation = Generation(
                title=topic,
                content=generated_content,
                style_profile_id=style_profile.id
            )
            
            if user:
                generation.user_id = user.id
            
            if anonymous_user:
                generation.anonymous_user_id = anonymous_user.id
            
            db.add(generation)
            db.commit()
            db.refresh(generation)
            
            actual_word_count = count_words(generated_content)

            if user:
                generation.user_id = user.id
                track_word_usage(db, user, generation, actual_word_count)

            if anonymous_user:
                generation.anonymous_user_id = anonymous_user.id
                track_word_usage_for_anonymous_user(db, anonymous_user, generation, actual_word_count)
                
            send_slack_notification(f"User {user.username if user else anonymous_user.id} has generated content with profile {profile_id} and topic {topic} and length {length} and stream {stream}")
            
            return JSONResponse(content={
                "success": True,
                "generated_content": generated_content,
                "topic": topic,
                "length": length
            })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error generating content: {str(e)}"}
        )