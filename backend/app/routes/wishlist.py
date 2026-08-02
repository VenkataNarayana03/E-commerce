from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.wishlist import WishlistItemRead
from app.services import wishlist_service

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("", response_model=list[WishlistItemRead])
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return wishlist_service.get_user_wishlist(db, current_user.id)


@router.post("/{product_id}", response_model=WishlistItemRead)
def add_to_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return wishlist_service.add_to_wishlist(db, current_user.id, product_id)


@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return wishlist_service.remove_from_wishlist(db, current_user.id, product_id)
