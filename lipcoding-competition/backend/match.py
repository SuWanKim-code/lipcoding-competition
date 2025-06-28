# This file will contain endpoints for match request (send, accept, reject, cancel).
# To be implemented in the next step.

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole, MatchRequest, MatchStatus
from schemas import UserResponse
from auth import get_current_user, get_db
from typing import List
from pydantic import BaseModel

router = APIRouter()

class MatchRequestCreate(BaseModel):
    mentorId: int
    message: str

@router.post("/match-requests")
def create_match_request(
    req: MatchRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can send match requests")
    # 중복 요청/수락/대기 중 체크
    existing = db.query(MatchRequest).filter(
        MatchRequest.mentee_id == current_user.id,
        MatchRequest.status.in_([MatchStatus.pending, MatchStatus.accepted])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending/accepted request")
    mentor = db.query(User).filter(User.id == req.mentorId, User.role == UserRole.mentor).first()
    if not mentor:
        raise HTTPException(status_code=400, detail="Mentor not found")
    match_req = MatchRequest(
        mentor_id=req.mentorId,
        mentee_id=current_user.id,
        message=req.message,
        status=MatchStatus.pending
    )
    db.add(match_req)
    db.commit()
    db.refresh(match_req)
    return {
        "id": match_req.id,
        "mentorId": match_req.mentor_id,
        "menteeId": match_req.mentee_id,
        "message": match_req.message,
        "status": match_req.status
    }

@router.get("/match-requests/incoming")
def incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.mentor:
        raise HTTPException(status_code=403, detail="Only mentors can view incoming requests")
    reqs = db.query(MatchRequest).filter(MatchRequest.mentor_id == current_user.id).all()
    return [
        {
            "id": r.id,
            "mentorId": r.mentor_id,
            "menteeId": r.mentee_id,
            "message": r.message,
            "status": r.status
        } for r in reqs
    ]

@router.get("/match-requests/outgoing")
def outgoing_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.mentee:
        raise HTTPException(status_code=403, detail="Only mentees can view outgoing requests")
    reqs = db.query(MatchRequest).filter(MatchRequest.mentee_id == current_user.id).all()
    return [
        {
            "id": r.id,
            "mentorId": r.mentor_id,
            "menteeId": r.mentee_id,
            "status": r.status
        } for r in reqs
    ]

@router.put("/match-requests/{id}/accept")
def accept_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.mentor:
        raise HTTPException(status_code=403, detail="Only mentors can accept requests")
    req = db.query(MatchRequest).filter(MatchRequest.id == id, MatchRequest.mentor_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    # 한 명만 수락, 나머지 자동 거절
    accepted = db.query(MatchRequest).filter(
        MatchRequest.mentor_id == current_user.id,
        MatchRequest.status == MatchStatus.accepted
    ).first()
    if accepted:
        raise HTTPException(status_code=400, detail="Already accepted a mentee")
    req.status = MatchStatus.accepted
    # 나머지 pending 요청 자동 거절
    others = db.query(MatchRequest).filter(
        MatchRequest.mentor_id == current_user.id,
        MatchRequest.status == MatchStatus.pending,
        MatchRequest.id != id
    ).all()
    for o in others:
        o.status = MatchStatus.rejected
    db.commit()
    db.refresh(req)
    return {
        "id": req.id,
        "mentorId": req.mentor_id,
        "menteeId": req.mentee_id,
        "message": req.message,
        "status": req.status
    }

@router.put("/match-requests/{id}/reject")
def reject_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.mentor:
        raise HTTPException(status_code=403, detail="Only mentors can reject requests")
    req = db.query(MatchRequest).filter(MatchRequest.id == id, MatchRequest.mentor_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = MatchStatus.rejected
    db.commit()
    db.refresh(req)
    return {
        "id": req.id,
        "mentorId": req.mentor_id,
        "menteeId": req.mentee_id,
        "message": req.message,
        "status": req.status
    }

@router.delete("/match-requests/{id}")
def cancel_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(MatchRequest).filter(MatchRequest.id == id, MatchRequest.mentee_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = MatchStatus.cancelled
    db.commit()
    db.refresh(req)
    return {
        "id": req.id,
        "mentorId": req.mentor_id,
        "menteeId": req.mentee_id,
        "message": req.message,
        "status": req.status
    }

@router.post("/unmatch")
def unmatch(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from models import MatchRequest, MatchStatus
    if current_user.role == UserRole.mentor:
        accepted = db.query(MatchRequest).filter(MatchRequest.mentor_id == current_user.id, MatchRequest.status == MatchStatus.accepted).first()
        if not accepted:
            raise HTTPException(status_code=400, detail="No matched mentee")
        accepted.status = MatchStatus.cancelled
        db.commit()
        return {"detail": "Unmatched"}
    elif current_user.role == UserRole.mentee:
        accepted = db.query(MatchRequest).filter(MatchRequest.mentee_id == current_user.id, MatchRequest.status == MatchStatus.accepted).first()
        if not accepted:
            raise HTTPException(status_code=400, detail="No matched mentor")
        accepted.status = MatchStatus.cancelled
        db.commit()
        return {"detail": "Unmatched"}
    else:
        raise HTTPException(status_code=400, detail="Invalid role")
