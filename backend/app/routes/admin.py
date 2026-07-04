from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_admin
from app.models.user import User
from app.schemas.user import AdminDashboard

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard", response_model=AdminDashboard)
def admin_dashboard(current_user: User = Depends(get_current_admin)) -> AdminDashboard:
    return AdminDashboard(user=current_user, message="Admin dashboard access granted")

