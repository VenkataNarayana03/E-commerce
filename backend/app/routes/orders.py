from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.order import OrderCreate, OrderListResponse, OrderRead
from app.services import order_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderRead:
    return order_service.create_order(db, current_user.id, payload)


@router.get("", response_model=OrderListResponse)
def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderListResponse:
    orders, total = order_service.get_user_orders(db, current_user.id)
    return OrderListResponse(items=orders, total=total)


@router.get("/{order_id}", response_model=OrderRead)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderRead:
    is_admin = current_user.role == "admin"
    return order_service.get_order_by_id(db, current_user.id, order_id, is_admin=is_admin)
