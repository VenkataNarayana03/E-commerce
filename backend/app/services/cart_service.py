from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.cart_item import CartItem
from app.models.product import Product
from app.schemas.cart import CartResponse


def get_cart_response(db: Session, user_id: int) -> CartResponse:
    stmt = (
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .order_by(CartItem.id.asc())
    )
    items = list(db.scalars(stmt).all())
    subtotal = sum(Decimal(str(item.product.price)) * item.quantity for item in items if item.product)
    total_items = sum(item.quantity for item in items)
    return CartResponse(items=items, subtotal=Decimal(str(subtotal)), total_items=total_items)


def add_to_cart(db: Session, user_id: int, product_id: int, quantity: int) -> CartResponse:
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not available")

    if product.stock_quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product is out of stock")

    stmt = select(CartItem).where(CartItem.user_id == user_id, CartItem.product_id == product_id)
    cart_item = db.scalar(stmt)

    if cart_item:
        new_quantity = cart_item.quantity + quantity
        if new_quantity > product.stock_quantity:
            new_quantity = product.stock_quantity
        cart_item.quantity = new_quantity
    else:
        initial_quantity = min(quantity, product.stock_quantity)
        cart_item = CartItem(user_id=user_id, product_id=product_id, quantity=initial_quantity)
        db.add(cart_item)

    db.commit()
    return get_cart_response(db, user_id)


def update_cart_item(db: Session, user_id: int, cart_item_id: int, quantity: int) -> CartResponse:
    stmt = select(CartItem).where(CartItem.id == cart_item_id, CartItem.user_id == user_id)
    cart_item = db.scalar(stmt)
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    product = db.get(Product, cart_item.product_id)
    if product and quantity > product.stock_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock_quantity} items available in stock",
        )

    cart_item.quantity = quantity
    db.commit()
    return get_cart_response(db, user_id)


def remove_cart_item(db: Session, user_id: int, cart_item_id: int) -> CartResponse:
    stmt = select(CartItem).where(CartItem.id == cart_item_id, CartItem.user_id == user_id)
    cart_item = db.scalar(stmt)
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return get_cart_response(db, user_id)


def clear_cart(db: Session, user_id: int) -> CartResponse:
    stmt = select(CartItem).where(CartItem.user_id == user_id)
    cart_items = list(db.scalars(stmt).all())
    for item in cart_items:
        db.delete(item)
    db.commit()
    return get_cart_response(db, user_id)
