from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.user import UserRead


class OrderItemRead(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    payment_method: str = Field(default="cod", max_length=30)
    shipping_name: str = Field(min_length=2, max_length=120)
    shipping_phone: str = Field(min_length=5, max_length=30)
    shipping_address_line1: str = Field(min_length=3, max_length=255)
    shipping_address_line2: str | None = Field(default=None, max_length=255)
    shipping_city: str = Field(min_length=2, max_length=100)
    shipping_state: str = Field(min_length=2, max_length=100)
    shipping_postal_code: str = Field(min_length=3, max_length=20)
    shipping_country: str = Field(default="India", max_length=80)


class OrderRead(BaseModel):
    id: int
    user_id: int
    order_number: str
    status: str
    payment_method: str
    shipping_name: str
    shipping_phone: str
    shipping_address_line1: str
    shipping_address_line2: str | None
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str
    subtotal: Decimal
    shipping_fee: Decimal
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]
    user: UserRead | None = None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderRead]
    total: int
