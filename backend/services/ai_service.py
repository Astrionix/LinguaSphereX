import os
import requests
from typing import List, Optional, Dict, Any
from groq import Groq
try:
    from config import settings
except ImportError:
    from backend.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def generate_chat_response(messages: List[Dict[str, str]], model: str = settings.GROQ_MODEL) -> Any:
    """
    Generates a response using Groq Llama-3.
    """
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )
        return completion
    except Exception as e:
        print(f"Error generating response: {e}")
        return None

def translate_text(text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
    """
    Translates text using Hugging Face Inference API (NLLB).
    """
    API_URL = f"https://api-inference.huggingface.co/models/{settings.TRANSLATION_MODEL}"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
    
    payload = {
        "inputs": text,
        "parameters": {"src_lang": source_lang, "tgt_lang": target_lang}
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()
    except Exception as e:
        print(f"Translation error: {e}")
        return {"error": str(e)}

def get_embeddings(text: str) -> Optional[List[float]]:
    """
    Generates embeddings using Hugging Face (multilingual-e5-large).
    """
    API_URL = f"https://api-inference.huggingface.co/models/{settings.EMBEDDING_MODEL}"
    headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
    
    try:
        response = requests.post(API_URL, headers=headers, json={"inputs": text})
        if response.status_code == 200:
             # Embedding API usually returns a list of embeddings
             return response.json()
        else:
             print(f"Embedding API Error: {response.status_code} - {response.text}")
             return None
    except Exception as e:
        print(f"Embedding error: {e}")
        return None

def detect_language(text: str) -> str:
    """
    Detects language using Groq (LLM). Returns ISO 639-1 code (e.g., 'en', 'es').
    """
    try:
        messages = [
            {"role": "system", "content": "You are a language detector. Return only the 2-letter ISO 639-1 language code for the following text. Do not add any explanation or punctuation. If uncertain, return 'en'."},
            {"role": "user", "content": text}
        ]
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0,
            max_tokens=5,
            stop=None,
            stream=False
        )
        lang_code = completion.choices[0].message.content.strip().lower()
        # Basic validation (2-3 chars)
        if len(lang_code) > 3 or len(lang_code) < 2:
            return "en"
        return lang_code
    except Exception as e:
        print(f"Language detection error: {e}")
        return "en"
