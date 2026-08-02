import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { wishlistService } from "../../services/wishlistService.js";
import { reviewService } from "../../services/reviewService.js";
import { formatDualPrice } from "../../utils/price.js";

function ProductCard({ product, onWishlistToggle, isInitiallyWishlisted = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isBuying, setIsBuying] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(isInitiallyWishlisted);
  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const imageUrl = product.image_url || product.imageUrl || "https://placehold.co/600x400?text=Product";

  useEffect(() => {
    let isMounted = true;
    reviewService
      .getRatingSummary(product.id)
      .then((data) => {
        if (isMounted) setRatingSummary(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [product.id]);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Please log in to add items to your wishlist.");
      navigate("/login");
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product.id);
        setIsWishlisted(false);
        toast.info("Removed from wishlist");
      } else {
        await wishlistService.addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
      if (onWishlistToggle) onWishlistToggle();
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBuying(true);
    try {
      await addToCart(product, 1);
      navigate("/checkout");
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden position-relative">
      {/* Wishlist Heart Button */}
      <button
        type="button"
        className={`btn btn-sm rounded-circle position-absolute top-0 end-0 m-2 shadow-sm ${
          isWishlisted ? "btn-danger text-white" : "btn-light text-secondary opacity-75 hover-opacity-100"
        }`}
        style={{ zIndex: 5, width: "34px", height: "34px" }}
        onClick={handleWishlistClick}
        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`}></i>
      </button>

      <Link to={`/products/${product.id}`} className="text-decoration-none text-dark">
        <img
          src={imageUrl}
          className="card-img-top product-card-img"
          alt={product.name}
        />
      </Link>
      <div className="card-body d-flex flex-column p-3">
        <h2 className="h6 card-title fw-bold mb-1">
          <Link to={`/products/${product.id}`} className="text-decoration-none text-dark">
            {product.name}
          </Link>
        </h2>
        
        {/* Rating Stars Summary */}
        <div className="d-flex align-items-center gap-1 mb-2">
          <div className="text-warning small">
            {[1, 2, 3, 4, 5].map((star) => (
              <i
                key={star}
                className={`bi ${
                  ratingSummary.average_rating >= star
                    ? "bi-star-fill"
                    : ratingSummary.average_rating >= star - 0.5
                    ? "bi-star-half"
                    : "bi-star"
                }`}
              ></i>
            ))}
          </div>
          <small className="text-muted" style={{ fontSize: "0.75rem" }}>
            {ratingSummary.average_rating > 0 ? `${ratingSummary.average_rating} (${ratingSummary.total_reviews})` : "New"}
          </small>
        </div>

        <p className="card-text text-muted small flex-grow-1 mb-2 line-clamp-2">{product.description}</p>
        
        {product.category?.name && (
          <span className="badge bg-light text-primary border align-self-start mb-3 px-2 py-1 rounded-pill small">
            {product.category.name}
          </span>
        )}

        <div className="d-flex align-items-center justify-content-between mb-2">
          <strong className="text-primary fs-6">{formatDualPrice(product.price)}</strong>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm rounded-pill flex-grow-1 font-semibold"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            title="Add to Cart"
          >
            <i className="bi bi-cart-plus me-1"></i> Add
          </button>
          <button
            className="btn btn-success btn-sm rounded-pill flex-grow-1 fw-bold shadow-sm"
            onClick={handleBuyNow}
            disabled={isBuying || product.stock_quantity === 0}
            title="Order Directly"
          >
            {isBuying ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
