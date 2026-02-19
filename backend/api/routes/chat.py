from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

# Services
from services import ai_service
from rag.pipeline import rag

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = [] # list of {"role": "user", "content": "..."}
    target_language: str = "en" # Default to English if not specified
    use_rag: bool = True

from utils.lang_map import get_nllb_code

@router.post("/send")
async def send_message(request: ChatRequest):
    try:
        user_message = request.message
        
        # 1. Detect Language
        detected_lang = ai_service.detect_language(user_message)
        logging.info(f"Detected language: {detected_lang}")

        # 2. Translate to English for RAG (if needed)
        english_query = user_message
        source_nllb = get_nllb_code(detected_lang)
        english_nllb = "eng_Latn"
        
        if source_nllb != english_nllb and detected_lang != "en":
             logging.info(f"Translating {detected_lang} -> en for RAG")
             translation = ai_service.translate_text(user_message, source_lang=source_nllb, target_lang=english_nllb)
             if "translation_text" in translation:
                  english_query = translation["translation_text"]
             elif isinstance(translation, list) and len(translation) > 0 and "translation_text" in translation[0]:
                  english_query = translation[0]["translation_text"]
        
        # 3. Retrieve Context (RAG)
        context_text = ""
        if request.use_rag:
            docs = rag.query_context(english_query)
            context_text = "\n".join(docs)
        
        # 4. Construct Prompt
        # Key Change: We instruct LLM to handle the language response naturally.
        lang_instruction = f"The user is writing in {detected_lang}. Respond in the SAME language and style as the user (e.g., if Hinglish, use Hinglish). Do NOT translate unless asked."
        if detected_lang == "en":
            lang_instruction = "Respond in English."

        system_prompt = {
            "role": "system", 
            "content": f"""You are LinguaSphere, a helpful multilingual AI assistant. 
Context from knowledge base:
{context_text}

Instructions:
1. {lang_instruction}
2. Use the provided context to answer if relevant.
3. Be professional yet conversational.
4. If technical terms are used, preserve them.
"""
        }
        
        # Conversation History - Pass Original Messages
        formatted_history = [system_prompt]
        for msg in request.history[-5:]: # Keep last 5 turns
            formatted_history.append({"role": msg["role"], "content": msg["content"]})
            
        # Pass the ORIGINAL user message to the LLM so it sees the language/style
        formatted_history.append({"role": "user", "content": user_message})
        
        # 5. Call LLM
        response = ai_service.generate_chat_response(formatted_history)
        
        # Extract text
        bot_response = ""
        if response:
             for chunk in response:
                 if chunk.choices[0].delta.content:
                     bot_response += chunk.choices[0].delta.content
        else:
             bot_response = "Sorry, I am unable to respond at the moment."
                
        # 6. Generate English Reference (for UI "Original" tooltip)
        bot_response_en = bot_response
        if detected_lang != "en":
             # Translate the foreign response back to English for the UI's reference field
             logging.info(f"Translating Response {detected_lang} -> en for reference")
             translation_back = ai_service.translate_text(bot_response, source_lang=get_nllb_code(detected_lang), target_lang=english_nllb)
             if "translation_text" in translation_back:
                  bot_response_en = translation_back["translation_text"]
             elif isinstance(translation_back, list) and len(translation_back) > 0 and "translation_text" in translation_back[0]:
                  bot_response_en = translation_back[0]["translation_text"]

        return {
            "response": bot_response,
            "original_response_en": bot_response_en,
            "detected_language": detected_lang
        }

    except Exception as e:
        logging.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(user_id: str):
    # Retrieve from Supabase (Placeholder)
    return {"history": []}

