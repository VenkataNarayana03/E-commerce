from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserDashboard

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me/dashboard", response_model=UserDashboard)
def customer_dashboard(current_user: User = Depends(get_current_user)) -> UserDashboard:
    return UserDashboard(user=current_user, message="Customer dashboard access granted")

