from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead
from app.services import review_service

router = APIRouter(prefix="/api/products", tags=["reviews"])


@router.get("/{product_id}/reviews", response_model=list[ReviewRead])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    return review_service.get_product_reviews(db, product_id)


@router.get("/{product_id}/rating-summary")
def get_rating_summary(product_id: int, db: Session = Depends(get_db)):
    return review_service.get_product_rating_summary(db, product_id)


@router.post("/{product_id}/reviews", response_model=ReviewRead)
def submit_review(
    product_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return review_service.add_or_update_review(db, current_user.id, product_id, payload)
