from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def list_categories(db: Session, active_only: bool = True) -> list[Category]:
    statement = select(Category).order_by(Category.name)
    if active_only:
        statement = statement.where(Category.is_active.is_(True))
    return list(db.scalars(statement))


def get_category(db: Session, category_id: int) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


def create_category(db: Session, payload: CategoryCreate) -> Category:
    _ensure_category_unique(db, payload.name, payload.slug)
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: int, payload: CategoryUpdate) -> Category:
    category = get_category(db, category_id)
    data = payload.model_dump(exclude_unset=True)
    if "name" in data or "slug" in data:
        _ensure_category_unique(
            db,
            data.get("name", category.name),
            data.get("slug", category.slug),
            category_id=category.id,
        )
    for field, value in data.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int) -> None:
    category = get_category(db, category_id)
    if category.products:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a category that has products",
        )
    db.delete(category)
    db.commit()


def _ensure_category_unique(
    db: Session,
    name: str,
    slug: str,
    category_id: int | None = None,
) -> None:
    statement = select(Category).where((Category.name == name) | (Category.slug == slug))
    if category_id is not None:
        statement = statement.where(Category.id != category_id)
    existing = db.scalar(statement)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category name or slug already exists",
        )

