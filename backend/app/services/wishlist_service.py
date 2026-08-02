from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.wishlist_item import WishlistItem


def get_user_wishlist(db: Session, user_id: int) -> list[WishlistItem]:
    stmt = (
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .options(joinedload(WishlistItem.product).joinedload(Product.category))
        .order_by(WishlistItem.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def add_to_wishlist(db: Session, user_id: int, product_id: int) -> WishlistItem:
    # Check product exists
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Check if already in wishlist
    stmt = select(WishlistItem).where(WishlistItem.user_id == user_id, WishlistItem.product_id == product_id)
    existing = db.scalar(stmt)
    if existing:
        stmt_existing = (
            select(WishlistItem)
            .where(WishlistItem.id == existing.id)
            .options(joinedload(WishlistItem.product).joinedload(Product.category))
        )
        return db.scalar(stmt_existing)

    item = WishlistItem(user_id=user_id, product_id=product_id)
    db.add(item)
    db.commit()

    # Refresh with loaded product and category
    stmt = (
        select(WishlistItem)
        .where(WishlistItem.id == item.id)
        .options(joinedload(WishlistItem.product).joinedload(Product.category))
    )
    return db.scalar(stmt)


def remove_from_wishlist(db: Session, user_id: int, product_id: int):
    stmt = select(WishlistItem).where(WishlistItem.user_id == user_id, WishlistItem.product_id == product_id)
    item = db.scalar(stmt)
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Removed from wishlist"}
