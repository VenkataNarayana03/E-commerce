from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.category import Category
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderListResponse, OrderRead
from app.schemas.user import AdminDashboard, AdminSummary, UserRead
from app.services import order_service

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
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0
    total_revenue = db.scalar(select(func.sum(Order.total_amount)).where(Order.status != "cancelled")) or Decimal("0.00")

    return AdminSummary(
        total_users=total_users,
        total_products=total_products,
        active_categories=active_categories,
        blocked_users=blocked_users,
        total_orders=total_orders,
        total_revenue=Decimal(str(total_revenue)),
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


@router.get("/orders", response_model=OrderListResponse)
def admin_list_orders(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> OrderListResponse:
    orders, total = order_service.get_all_orders_admin(db)
    return OrderListResponse(items=orders, total=total)


@router.put("/orders/{order_id}/status", response_model=OrderRead)
def admin_update_order_status(
    order_id: int,
    payload: dict[str, str],
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> OrderRead:
    status_value = payload.get("status")
    if not status_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'status' in request body")

    return order_service.update_order_status_admin(db, order_id, status_value)
