from datetime import datetime
from pydantic import BaseModel, Field


class AddressCreate(BaseModel):
    shipping_name: str = Field(min_length=2, max_length=120)
    shipping_phone: str = Field(min_length=5, max_length=30)
    shipping_address_line1: str = Field(min_length=3, max_length=255)
    shipping_address_line2: str | None = Field(default=None, max_length=255)
    shipping_city: str = Field(min_length=2, max_length=100)
    shipping_state: str = Field(min_length=2, max_length=100)
    shipping_postal_code: str = Field(min_length=3, max_length=20)
    shipping_country: str = Field(default="India", max_length=80)
    is_default: bool = False


class AddressUpdate(BaseModel):
    shipping_name: str | None = None
    shipping_phone: str | None = None
    shipping_address_line1: str | None = None
    shipping_address_line2: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_postal_code: str | None = None
    shipping_country: str | None = None
    is_default: bool | None = None


class AddressRead(BaseModel):
    id: int
    user_id: int
    shipping_name: str
    shipping_phone: str
    shipping_address_line1: str
    shipping_address_line2: str | None
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
