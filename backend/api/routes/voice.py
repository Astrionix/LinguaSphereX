from fastapi import APIRouter

router = APIRouter()

@router.post("/transcribe")
async def transcribe(audio_file: str):
    return {"text": "Transcribed placeholder"}

@router.post("/speak")
async def speak(text: str, language: str):
    return {"audio_url": "dummy_audio_link.mp3"}
