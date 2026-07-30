from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse
from app.services import cart_service

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    return cart_service.get_cart_response(db, current_user.id)


@router.post("", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    payload: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    return cart_service.add_to_cart(db, current_user.id, payload.product_id, payload.quantity)


@router.put("/{cart_item_id}", response_model=CartResponse)
def update_cart_item(
    cart_item_id: int,
    payload: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    return cart_service.update_cart_item(db, current_user.id, cart_item_id, payload.quantity)


@router.delete("/{cart_item_id}", response_model=CartResponse)
def remove_cart_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    return cart_service.remove_cart_item(db, current_user.id, cart_item_id)


@router.delete("", response_model=CartResponse)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CartResponse:
    return cart_service.clear_cart(db, current_user.id)
