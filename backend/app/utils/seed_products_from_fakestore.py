import json
import re
from decimal import Decimal
from pathlib import Path
from urllib.request import Request, urlopen

from sqlalchemy import select

from app.database import SessionLocal
from app.models.category import Category
from app.models.product import Product

API_URL = "https://dummyjson.com/products?limit=100"
TARGET_CATEGORIES = {"smartphones", "laptops"}
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "dummyjson_mobile_laptop_products.json"


def fetch_products_from_api() -> list[dict]:
    request = Request(API_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)

    if isinstance(payload, dict):
        products = payload.get("products", [])
    elif isinstance(payload, list):
        products = payload
    else:
        raise ValueError("Unexpected response from DummyJSON API")

    if not isinstance(products, list):
        raise ValueError("Unexpected product payload from DummyJSON API")

    return [
        item
        for item in products
        if str(item.get("category", "")).lower() in TARGET_CATEGORIES
    ]


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "product"


def ensure_category(db, name: str, slug: str | None = None) -> Category:
    category_slug = slugify(slug or name)
    category = db.scalar(select(Category).where(Category.slug == category_slug))
    if category is None:
        category = Category(name=name, slug=category_slug, description=f"Products from {name}", is_active=True)
        db.add(category)
    else:
        category.name = name
        category.description = f"Products from {name}"
        category.is_active = True
    return category


def seed_products_from_fakestore() -> None:
    products_payload = fetch_products_from_api()
    OUTPUT_FILE.write_text(json.dumps(products_payload, indent=2), encoding="utf-8")

    db = SessionLocal()
    try:
        for product in db.scalars(select(Product)).all():
            db.delete(product)

        db.flush()

        category_cache: dict[str, Category] = {}
        for item in products_payload:
            category_name = item.get("category") or "Uncategorized"
            category_key = str(category_name).lower()
            display_name = "Mobiles" if category_key == "smartphones" else "Laptops"
            category = category_cache.get(category_key)
            if category is None:
                category = ensure_category(db, display_name, slug=category_key)
                category_cache[category_key] = category

        db.flush()

        for item in products_payload:
            category_name = item.get("category") or "Uncategorized"
            category_key = str(category_name).lower()
            display_name = "Mobiles" if category_key == "smartphones" else "Laptops"
            category = category_cache.get(category_key)
            if category is None:
                category = ensure_category(db, display_name, slug=category_key)
                category_cache[category_key] = category

            images = item.get("images") or []
            image_url = item.get("thumbnail") or (images[0] if images else item.get("image"))
            product = Product(
                category_id=category.id,
                name=item.get("title") or "Untitled Product",
                slug=slugify((item.get("title") or "Untitled Product") + f"-{item.get('id', 'product')}") ,
                description=item.get("description") or "",
                price=Decimal(str(item.get("price", 0))),
                stock_quantity=int(item.get("stock", 100)),
                image_url=image_url,
                is_active=True,
            )
            db.add(product)

        db.commit()
        print(f"Seeded {len(products_payload)} mobile/laptop products from DummyJSON API into the database")
        print(f"Saved product JSON to {OUTPUT_FILE}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_from_fakestore()
