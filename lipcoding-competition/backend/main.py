from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html

from routers import api_router

app = FastAPI(title="Mentor-Mentee Matching API")

# CORS (for frontend dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API router
app.include_router(api_router, prefix="/api")

@app.get("/openapi.json", include_in_schema=False)
def custom_openapi():
    return get_openapi(
        title=app.title,
        version="1.0.0",
        routes=app.routes,
        description="멘토-멘티 매칭 앱 OpenAPI 명세"
    )

@app.get("/swagger-ui", include_in_schema=False)
def swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Swagger UI"
    )

# Swagger UI redirect
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/swagger-ui")

# Serve images (will mount /images later)
# app.mount("/images", StaticFiles(directory="images"), name="images")
