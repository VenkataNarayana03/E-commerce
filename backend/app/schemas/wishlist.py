from datetime import datetime
from pydantic import BaseModel
from app.schemas.product import ProductRead


class WishlistItemRead(BaseModel):
    id: int
    user_id: int
    product_id: int
    product: ProductRead
    created_at: datetime

    model_config = {"from_attributes": True}
