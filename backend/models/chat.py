from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = datetime.now()

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []
    language: str = "en"
    use_rag: bool = True

class ChatResponse(BaseModel):
    response: str
    audio_url: Optional[str] = None
    sources: Optional[List[str]] = None
