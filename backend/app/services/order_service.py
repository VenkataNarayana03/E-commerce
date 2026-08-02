import uuid
from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.cart_item import CartItem
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate

VALID_ORDER_STATUSES = {
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
}


def generate_order_number() -> str:
    now_str = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"ORD-{now_str}-{short_uuid}"


def create_order(db: Session, user_id: int, payload: OrderCreate) -> Order:
    # 1. Fetch user cart items
    stmt = (
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(joinedload(CartItem.product))
    )
    cart_items = list(db.scalars(stmt).all())

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add products to cart before checkout.",
        )

    # 2. Check stock for each product
    subtotal = Decimal("0.00")
    order_items_to_create = []

    for item in cart_items:
        product = item.product
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{item.product_id}' is no longer available.",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, requested: {item.quantity}.",
            )

        line_total = Decimal(str(product.price)) * item.quantity
        subtotal += line_total

        order_items_to_create.append({
            "product": product,
            "product_id": product.id,
            "product_name": product.name,
            "unit_price": Decimal(str(product.price)),
            "quantity": item.quantity,
            "line_total": line_total,
        })

    # 3. Calculate shipping & totals
    shipping_fee = Decimal("0.00") if subtotal >= Decimal("50.00") else Decimal("5.99")
    total_amount = subtotal + shipping_fee
    order_number = generate_order_number()

    # 4. Create Order
    new_order = Order(
        user_id=user_id,
        order_number=order_number,
        status="confirmed",
        payment_method=payload.payment_method,
        shipping_name=payload.shipping_name,
        shipping_phone=payload.shipping_phone,
        shipping_address_line1=payload.shipping_address_line1,
        shipping_address_line2=payload.shipping_address_line2,
        shipping_city=payload.shipping_city,
        shipping_state=payload.shipping_state,
        shipping_postal_code=payload.shipping_postal_code,
        shipping_country=payload.shipping_country,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        total_amount=total_amount,
    )
    db.add(new_order)
    db.flush()

    # 5. Create OrderItems & reduce stock
    for item_data in order_items_to_create:
        order_item = OrderItem(
            order_id=new_order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            line_total=item_data["line_total"],
        )
        db.add(order_item)

        # Reduce product stock
        product = item_data["product"]
        product.stock_quantity -= item_data["quantity"]

    # 6. Clear user cart
    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(new_order)
    return new_order


def get_user_orders(db: Session, user_id: int) -> tuple[list[Order], int]:
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
    )
    orders = list(db.scalars(stmt).unique().all())
    return orders, len(orders)


def get_all_orders_admin(db: Session) -> tuple[list[Order], int]:
    stmt = (
        select(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .order_by(Order.created_at.desc())
    )
    orders = list(db.scalars(stmt).unique().all())
    return orders, len(orders)


def update_order_status_admin(db: Session, order_id: int, new_status: str) -> Order:
    status_clean = new_status.lower().strip()
    if status_clean not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed values: {', '.join(VALID_ORDER_STATUSES)}",
        )

    stmt = select(Order).where(Order.id == order_id).options(joinedload(Order.items))
    order = db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = status_clean
    db.commit()
    db.refresh(order)
    return order


def get_order_by_id(db: Session, user_id: int, order_id: int, is_admin: bool = False) -> Order:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(joinedload(Order.items), joinedload(Order.user))
    )
    order = db.scalar(stmt)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if not is_admin and order.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return order
