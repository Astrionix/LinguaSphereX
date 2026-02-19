import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX_HOST = os.getenv("PINECONE_INDEX_HOST")

# Models
GROQ_MODEL = "llama-3.3-70b-versatile"
TRANSLATION_MODEL = "facebook/nllb-200-distilled-600M"
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
WHISPER_MODEL = "openai/whisper-large-v3"
