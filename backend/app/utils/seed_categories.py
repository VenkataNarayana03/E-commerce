from sqlalchemy import select

from app.database import SessionLocal
from app.models.category import Category

SEED_CATEGORIES = [
    {
        "name": "Fashion",
        "slug": "fashion",
        "description": "Clothing and everyday wear.",
    },
    {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Useful gadgets and accessories.",
    },
    {
        "name": "Home & Kitchen",
        "slug": "home-kitchen",
        "description": "Household essentials and kitchen appliances.",
    },
    {
        "name": "Beauty & Personal Care",
        "slug": "beauty-personal-care",
        "description": "Cosmetics, skincare, and grooming products.",
    },
    {
        "name": "Books",
        "slug": "books",
        "description": "Books and educational materials.",
    },
    {
        "name": "Sports & Fitness",
        "slug": "sports-fitness",
        "description": "Fitness gear and sporting essentials.",
    },
    {
        "name": "Toys & Games",
        "slug": "toys-games",
        "description": "Children's toys, games, and fun activities.",
    },
    {
        "name": "Grocery",
        "slug": "grocery",
        "description": "Daily essentials and pantry staples.",
    },
    {
        "name": "Furniture",
        "slug": "furniture",
        "description": "Comfortable and stylish home furniture.",
    },
    {
        "name": "Office Supplies",
        "slug": "office-supplies",
        "description": "Stationery and office essentials.",
    },
]


def seed_categories() -> None:
    db = SessionLocal()
    created = 0
    updated = 0
    try:
        for item in SEED_CATEGORIES:
            category = db.scalar(select(Category).where(Category.slug == item["slug"]))
            if category:
                category.name = item["name"]
                category.description = item["description"]
                category.is_active = True
                updated += 1
            else:
                db.add(Category(**item, is_active=True))
                created += 1
        db.commit()
        print(f"Categories seeded. Created: {created}, updated: {updated}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()

