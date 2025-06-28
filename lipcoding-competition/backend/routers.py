from fastapi import APIRouter
from auth import router as auth_router
from profile import router as profile_router
from mentor import router as mentor_router
from match import router as match_router

api_router = APIRouter()

# Here you will include all API endpoints from different modules (auth, user, mentor, match, etc.)
# Example:
# from .auth import router as auth_router
# api_router.include_router(auth_router)

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(mentor_router)
api_router.include_router(match_router)
