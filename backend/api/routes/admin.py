from fastapi import APIRouter

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    return {
        "total_users": 100,
        "active_conversations": 45,
        "total_requests": 1599
    }
