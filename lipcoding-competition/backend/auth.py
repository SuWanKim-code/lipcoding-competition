from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse, UserProfile
from utils import hash_password, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from typing import Optional

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    from utils import decode_access_token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@router.post("/signup", status_code=201)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        role=req.role,
        name=req.name,
        bio="",
        skills=",".join(req.role == UserRole.mentor and [] or []),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email, "role": user.role}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({
        "sub": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
    })
    return {"token": token}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = {
        "name": current_user.name,
        "bio": current_user.bio,
        "imageUrl": f"/images/{current_user.role.value}/{current_user.id}",
        "skills": current_user.role == UserRole.mentor and (current_user.skills or "").split(",") or None
    }
    # 매칭된 상대방 정보 추가
    matchedUser = None
    from models import MatchRequest, MatchStatus, User as UserModel
    if current_user.role == UserRole.mentor:
        accepted = db.query(MatchRequest).filter(MatchRequest.mentor_id == current_user.id, MatchRequest.status == MatchStatus.accepted).first()
        if accepted:
            mentee = db.query(UserModel).filter(UserModel.id == accepted.mentee_id).first()
            if mentee:
                matchedUser = {"id": mentee.id, "name": mentee.name, "email": mentee.email}
    elif current_user.role == UserRole.mentee:
        accepted = db.query(MatchRequest).filter(MatchRequest.mentee_id == current_user.id, MatchRequest.status == MatchStatus.accepted).first()
        if accepted:
            mentor = db.query(UserModel).filter(UserModel.id == accepted.mentor_id).first()
            if mentor:
                matchedUser = {"id": mentor.id, "name": mentor.name, "email": mentor.email}
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "profile": profile,
        "matchedUser": matchedUser
    }
