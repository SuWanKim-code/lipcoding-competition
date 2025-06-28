from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from schemas import UserResponse, UserProfile, ProfileUpdateRequest
from auth import get_current_user, get_db
import base64
from utils import verify_password
from typing import Optional

router = APIRouter()

@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.name = req.name
    current_user.bio = req.bio or ""
    if current_user.role == UserRole.mentor:
        current_user.skills = req.skills or ""
    if req.image:
        try:
            img_bytes = base64.b64decode(req.image)
            if len(img_bytes) > 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image too large (max 1MB)")
            # 간단한 포맷 체크 (jpg/png)
            if img_bytes[:3] == b'\xff\xd8\xff':
                mime = "image/jpeg"
            elif img_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                mime = "image/png"
            else:
                raise HTTPException(status_code=400, detail="Only .jpg/.png allowed")
            current_user.image = img_bytes
            current_user.image_mime = mime
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image data")
    db.commit()
    db.refresh(current_user)
    profile = {
        "name": current_user.name,
        "bio": current_user.bio,
        "imageUrl": f"/images/{current_user.role.value}/{current_user.id}",
        "skills": current_user.role == UserRole.mentor and (current_user.skills or "").split(",") or None
    }
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "profile": profile
    }

@router.get("/images/{role}/{user_id}")
def get_profile_image(role: str, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == role).first()
    if user and user.image and user.image_mime:
        from fastapi.responses import Response
        return Response(content=user.image, media_type=user.image_mime)
    # 기본 이미지
    if role == "mentor":
        return {"url": "https://placehold.co/500x500.jpg?text=MENTOR"}
    else:
        return {"url": "https://placehold.co/500x500.jpg?text=MENTEE"}
