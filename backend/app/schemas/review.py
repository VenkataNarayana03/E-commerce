from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserRead


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ReviewRead(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    comment: str | None
    created_at: datetime
    updated_at: datetime
    user: UserRead | None = None

    model_config = {"from_attributes": True}
