from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, artists, auth, platforms, analytics, alerts, spotify_auth, stream_history, momentum, actions

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="FanPulse API - Music Analytics for Managers",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.CORS_ORIGINS,  # Allow all origins in dev mode
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
app.include_router(spotify_auth.router, prefix="/api/spotify", tags=["spotify-auth"])
app.include_router(stream_history.router, prefix="/api/stream-history", tags=["stream-history"])
app.include_router(momentum.router, prefix="/api/momentum", tags=["momentum"])
app.include_router(actions.router, prefix="/api/actions", tags=["actions"])


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
