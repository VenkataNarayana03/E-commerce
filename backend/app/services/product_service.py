from fastapi import HTTPException, status
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(
    db: Session,
    search: str | None = None,
    category_id: int | None = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 12,
    active_only: bool = True,
) -> tuple[list[Product], int]:
    statement = select(Product).options(selectinload(Product.category))
    statement = _apply_product_filters(statement, search, category_id, active_only)

    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0

    sort_map = {
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "name_asc": Product.name.asc(),
        "oldest": Product.created_at.asc(),
        "newest": Product.created_at.desc(),
    }
    statement = statement.order_by(sort_map.get(sort, Product.created_at.desc()))
    statement = statement.offset((page - 1) * page_size).limit(page_size)

    return list(db.scalars(statement)), total


def get_product(db: Session, product_id: int, active_only: bool = True) -> Product:
    statement = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    if active_only:
        statement = statement.where(Product.is_active.is_(True))
    product = db.scalar(statement)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def create_product(db: Session, payload: ProductCreate) -> Product:
    _ensure_category_exists(db, payload.category_id)
    _ensure_product_slug_unique(db, payload.slug)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return get_product(db, product.id, active_only=False)


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    product = get_product(db, product_id, active_only=False)
    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data:
        _ensure_category_exists(db, data["category_id"])
    if "slug" in data and data["slug"] != product.slug:
        _ensure_product_slug_unique(db, data["slug"], product_id=product.id)
    for field, value in data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return get_product(db, product.id, active_only=False)


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id, active_only=False)
    db.delete(product)
    db.commit()


def _apply_product_filters(
    statement: Select[tuple[Product]],
    search: str | None,
    category_id: int | None,
    active_only: bool,
) -> Select[tuple[Product]]:
    if active_only:
        statement = statement.where(Product.is_active.is_(True))
    if category_id:
        statement = statement.where(Product.category_id == category_id)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Product.name.ilike(pattern),
                Product.description.ilike(pattern),
            )
        )
    return statement


def _ensure_category_exists(db: Session, category_id: int) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


def _ensure_product_slug_unique(db: Session, slug: str, product_id: int | None = None) -> None:
    statement = select(Product).where(Product.slug == slug)
    if product_id is not None:
        statement = statement.where(Product.id != product_id)
    existing = db.scalar(statement)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product slug already exists")

