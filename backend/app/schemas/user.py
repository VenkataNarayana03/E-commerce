from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminSummary(BaseModel):
    total_users: int
    total_products: int
    active_categories: int
    blocked_users: int


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    is_blocked: bool
    profile_image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserDashboard(BaseModel):
    user: UserRead
    message: str


class AdminDashboard(BaseModel):
    user: UserRead
    message: str

