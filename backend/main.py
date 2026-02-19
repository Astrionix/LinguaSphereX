import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.router import api_router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="LinguaSphere AI Backend",
    description="Backend for the LinguaSphere AI multilingual conversational platform.",
    version="1.0.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "https://linguasphere-ai:3000",
    # Add Vercel deployment URL later
    "*", # For development, allow all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the LinguaSphere AI API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
