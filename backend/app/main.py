from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, artists, auth, platforms, analytics, alerts

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="FanPulse API - Music Analytics for Managers",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(artists.router, prefix="/api/artists", tags=["artists"])
app.include_router(platforms.router, prefix="/api", tags=["platforms"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])
app.include_router(alerts.router, prefix="/api", tags=["alerts"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to FanPulse API",
        "version": "0.1.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
