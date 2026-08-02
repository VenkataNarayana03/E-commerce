from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.config import get_settings
from app.database import Base, engine
import app.models  # Ensure all models are loaded for table creation
from app.routes import addresses, admin, auth, cart, categories, orders, products, reviews, users, wishlist

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

settings = get_settings()

app = FastAPI(title="Ecommerce API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Ecommerce API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.exception_handler(OperationalError)
def database_error_handler(_request, _exc):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database connection failed. Check DATABASE_URL and Neon database status."},
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(addresses.router)
app.include_router(wishlist.router)
app.include_router(reviews.router)
