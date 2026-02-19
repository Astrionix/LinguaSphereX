from fastapi import APIRouter
from api.routes import chat, translation, voice, admin

api_router = APIRouter()

# Add routers
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(translation.router, prefix="/translate", tags=["Translation"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
