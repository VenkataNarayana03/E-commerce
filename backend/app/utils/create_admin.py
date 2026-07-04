import argparse

from sqlalchemy import select

from app.database import SessionLocal
from app.models.user import User
from app.services.security import hash_password


def create_admin(email: str, password: str, full_name: str) -> None:
    db = SessionLocal()
    try:
        normalized_email = email.lower()
        existing_user = db.scalar(select(User).where(User.email == normalized_email))

        if existing_user:
            existing_user.full_name = full_name
            existing_user.password_hash = hash_password(password)
            existing_user.role = "admin"
            existing_user.is_active = True
            existing_user.is_blocked = False
            action = "Updated"
        else:
            db.add(
                User(
                    email=normalized_email,
                    full_name=full_name,
                    password_hash=hash_password(password),
                    role="admin",
                    is_active=True,
                    is_blocked=False,
                )
            )
            action = "Created"

        db.commit()
        print(f"{action} admin user: {normalized_email}")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update an admin user.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--name", default="Admin User")
    args = parser.parse_args()

    create_admin(args.email, args.password, args.name)


if __name__ == "__main__":
    main()

