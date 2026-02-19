from fastapi import APIRouter

router = APIRouter()

@router.post("/translate")
async def translate_text(text: str, source: str, target: str):
    return {"original": text, "translated": f"Translated [{source} -> {target}]: {text}"}
