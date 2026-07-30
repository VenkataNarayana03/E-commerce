import json
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

from app.database import SessionLocal
from app.models.category import Category
from app.models.product import Product


def resolve_seed_file() -> Path:
    candidates = [
        Path(__file__).resolve().parents[3] / "seed_products_75.json",
        Path(__file__).resolve().parents[2] / "seed_products_75.json",
        Path.cwd() / "seed_products_75.json",
        Path("C:/Users/MOGILI JYOTHI/Downloads/seed_products_75.json"),
    ]
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("Could not find seed_products_75.json")


def seed_products_from_json() -> None:
    seed_file = resolve_seed_file()
    with seed_file.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    categories_payload = payload.get("categories", [])
    products_payload = payload.get("products", [])

    db = SessionLocal()
    try:
        category_by_name: dict[str, Category] = {}

        for item in categories_payload:
            slug = item["slug"]
            category = db.scalar(select(Category).where(Category.slug == slug))
            if category is None:
                category = Category(
                    name=item["name"],
                    slug=slug,
                    description=item.get("description"),
                    is_active=True,
                )
                db.add(category)
            else:
                category.name = item["name"]
                category.description = item.get("description")
                category.is_active = True

            category_by_name[item["name"]] = category

        db.flush()

        existing_products = list(db.scalars(select(Product)).all())
        for product in existing_products:
            db.delete(product)

        db.commit()

        created = 0
        for item in products_payload:
            category = category_by_name.get(item["category"])
            if category is None:
                raise ValueError(f"Unknown category in seed data: {item['category']}")

            product = Product(
                category_id=category.id,
                name=item["name"],
                slug=item["slug"],
                description=item.get("description"),
                price=Decimal(str(item["price"])),
                stock_quantity=int(item.get("stock", 0)),
                image_url=item.get("image_url"),
                is_active=True,
            )
            db.add(product)
            created += 1

        db.commit()
        print(f"Seeded {created} products from {seed_file}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_from_json()
