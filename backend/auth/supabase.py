from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
try:
    from config import settings
except ImportError:
    from backend.config import settings

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the JWT token from Supabase.
    Currently mocked for development convenience.
    """
    token = credentials.credentials
    # In production, verify JWT using Supabase secret
    # jwt.decode(token, settings.SUPABASE_KEY, algorithms=["HS256"])
    
    if token == "mock_token" or os.environ.get("ENV") == "development":
        return {"user_id": "mock_user", "email": "dev@linguasphere.ai"}
    
    # Real logic:
    # try:
    #     user = supabase.auth.get_user(token)
    #     return user
    # except:
    #     raise HTTPException(status_code=401, detail="Invalid token")
    
    # For now allow all
    return {"user_id": "anonymous"}
