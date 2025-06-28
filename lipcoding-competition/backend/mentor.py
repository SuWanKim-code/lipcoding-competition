from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from schemas import UserResponse, UserProfile
from auth import get_current_user, get_db
from typing import List, Optional

router = APIRouter()

@router.get("/mentors", response_model=List[UserResponse])
def list_mentors(
    skill: Optional[str] = None,
    order_by: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can view mentor list")
    query = db.query(User).filter(User.role == UserRole.mentor)
    if skill:
        query = query.filter(User.skills.like(f"%{skill}%"))
    if order_by == "name":
        query = query.order_by(User.name.asc())
    elif order_by == "skill":
        query = query.order_by(User.skills.asc())
    else:
        query = query.order_by(User.id.asc())
    mentors = query.all()
    result = []
    for m in mentors:
        profile = {
            "name": m.name,
            "bio": m.bio,
            "imageUrl": f"/images/mentor/{m.id}",
            "skills": (m.skills or "").split(",")
        }
        result.append({
            "id": m.id,
            "email": m.email,
            "role": m.role,
            "profile": profile
        })
    return result
