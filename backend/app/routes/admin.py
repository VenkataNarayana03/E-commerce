from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.services.security import decode_access_token

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.user import AdminDashboard, AdminSummary, UserRead

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard", response_model=AdminDashboard)
def admin_dashboard(current_user: User = Depends(get_current_admin)) -> AdminDashboard:
    return AdminDashboard(user=current_user, message="Admin dashboard access granted")


@router.get("/summary", response_model=AdminSummary)
def admin_summary(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AdminSummary:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    active_categories = db.scalar(select(func.count()).select_from(Category).where(Category.is_active.is_(True))) or 0
    blocked_users = db.scalar(select(func.count()).select_from(User).where(User.is_blocked.is_(True))) or 0

    return AdminSummary(
        total_users=total_users,
        total_products=total_products,
        active_categories=active_categories,
        blocked_users=blocked_users,
    )


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[UserRead]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return users


@router.put("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: dict[str, bool | str],
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> UserRead:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if "is_blocked" in payload:
        user.is_blocked = bool(payload["is_blocked"])
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    if "role" in payload and isinstance(payload["role"], str):
        user.role = payload["role"]

    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> Response:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

