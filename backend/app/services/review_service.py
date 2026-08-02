from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.review import Review
from app.schemas.review import ReviewCreate


def get_product_reviews(db: Session, product_id: int) -> list[Review]:
    stmt = (
        select(Review)
        .where(Review.product_id == product_id)
        .options(joinedload(Review.user))
        .order_by(Review.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def get_product_rating_summary(db: Session, product_id: int) -> dict:
    stmt = select(func.avg(Review.rating), func.count(Review.id)).where(Review.product_id == product_id)
    avg_rating, count = db.execute(stmt).one()
    return {
        "average_rating": round(float(avg_rating), 1) if avg_rating else 0.0,
        "total_reviews": count or 0,
    }


def add_or_update_review(db: Session, user_id: int, product_id: int, payload: ReviewCreate) -> Review:
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    stmt = select(Review).where(Review.user_id == user_id, Review.product_id == product_id)
    existing = db.scalar(stmt)

    if existing:
        existing.rating = payload.rating
        existing.comment = payload.comment
        db.commit()
        db.refresh(existing)
        target = existing
    else:
        new_review = Review(
            user_id=user_id,
            product_id=product_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        db.add(new_review)
        db.commit()
        target = new_review

    # Return with user loaded
    stmt = select(Review).where(Review.id == target.id).options(joinedload(Review.user))
    return db.scalar(stmt)
