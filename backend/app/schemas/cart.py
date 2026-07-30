from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.product import ProductRead


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemRead(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    created_at: datetime
    updated_at: datetime
    product: ProductRead

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    items: list[CartItemRead]
    subtotal: Decimal
    total_items: int
