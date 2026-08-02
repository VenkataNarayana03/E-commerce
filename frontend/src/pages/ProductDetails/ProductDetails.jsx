import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { wishlistService } from "../../services/wishlistService.js";
import { reviewService } from "../../services/reviewService.js";
import { formatDualPrice } from "../../utils/price.js";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, loading } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyNowLoading, setIsBuyNowLoading] = useState(false);
  const [error, setError] = useState("");

  // Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/products/${id}`)
      .then((response) => {
        setProduct(response.data);
        setError("");
      })
      .catch(() => setError("Product not found."))
      .finally(() => setIsLoading(false));

    loadReviews();

    if (user) {
      wishlistService
        .getWishlist()
        .then((items) => {
          const exists = items.some((i) => (i.product_id || i.product?.id) === Number(id));
          setIsWishlisted(exists);
        })
        .catch(() => {});
    }
  }, [id, user]);

  const loadReviews = async () => {
    try {
      const revs = await reviewService.getReviews(id);
      const summary = await reviewService.getRatingSummary(id);
      setReviews(revs || []);
      setRatingSummary(summary || { average_rating: 0, total_reviews: 0 });
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  const handleWishlistToggle = async () => {
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
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const handleAdd = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsBuyNowLoading(true);
    try {
      await addToCart(product, quantity);
      navigate("/checkout");
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuyNowLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in to submit a review.");
      navigate("/login");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await reviewService.submitReview(product.id, {
        rating: Number(newRating),
        comment: newComment,
      });
      toast.success("Thank you! Your rating & review has been saved to database.");
      setNewComment("");
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger rounded-3 mt-3">{error || "Product not found."}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row g-4 align-items-start mt-1 mb-5">
        {/* Image Box */}
        <div className="col-lg-6">
          <div className="bg-white p-3 border rounded-4 shadow-sm text-center position-relative">
            <button
              type="button"
              className={`btn rounded-circle position-absolute top-0 end-0 m-3 shadow-sm ${
                isWishlisted ? "btn-danger text-white" : "btn-light text-secondary"
              }`}
              style={{ width: "42px", height: "42px" }}
              onClick={handleWishlistToggle}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"} fs-5`}></i>
            </button>

            <img
              className="img-fluid rounded-3 object-fit-cover w-100"
              style={{ maxHeight: "450px" }}
              src={product.image_url || "https://placehold.co/900x600?text=Product"}
              alt={product.name}
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="col-lg-6">
          <div className="bg-white p-4 border rounded-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge bg-light text-primary border px-3 py-2 rounded-pill fw-semibold">
                {product.category?.name || "General"}
              </span>

              {/* Rating Star Header */}
              <div className="d-flex align-items-center gap-1 text-warning">
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
                <span className="text-dark fw-bold ms-1 small">
                  {ratingSummary.average_rating > 0 ? ratingSummary.average_rating : "No reviews yet"}
                </span>
                <span className="text-muted small">({ratingSummary.total_reviews})</span>
              </div>
            </div>

            <h1 className="h2 fw-bold text-dark mb-3">{product.name}</h1>
            <h3 className="text-primary fw-bold mb-3">{formatDualPrice(product.price)}</h3>

            <p className="text-muted mb-4" style={{ lineHeight: "1.6" }}>
              {product.description || "No detailed description available."}
            </p>

            <div className="mb-4">
              <span className={`fw-bold small px-3 py-1 rounded-pill ${product.stock_quantity > 0 ? "bg-success-subtle text-success border border-success" : "bg-danger-subtle text-danger border border-danger"}`}>
                {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} available)` : "Out of Stock"}
              </span>
            </div>

            {product.stock_quantity > 0 && (
              <div className="d-flex align-items-center gap-3 mb-4">
                <label className="fw-semibold text-dark mb-0">Quantity:</label>
                <div className="d-flex align-items-center border rounded-pill bg-light p-1">
                  <button
                    className="btn btn-sm btn-white text-dark rounded-circle shadow-none px-2 py-0"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-3 fw-bold text-dark">{quantity}</span>
                  <button
                    className="btn btn-sm btn-white text-dark rounded-circle shadow-none px-2 py-0"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="d-flex flex-column flex-sm-row gap-3">
              <button
                type="button"
                className="btn btn-outline-primary btn-lg rounded-pill px-4 fw-bold shadow-sm flex-grow-1"
                onClick={handleAdd}
                disabled={product.stock_quantity === 0 || loading}
              >
                <i className="bi bi-cart-plus me-2"></i>Add to Cart
              </button>
              <button
                type="button"
                className="btn btn-success btn-lg rounded-pill px-4 fw-bold shadow-sm flex-grow-1"
                onClick={handleBuyNow}
                disabled={product.stock_quantity === 0 || loading || isBuyNowLoading}
              >
                {isBuyNowLoading ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Ratings & Reviews Section */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="bg-white border rounded-4 p-4 shadow-sm">
            <h4 className="fw-bold text-dark mb-3">
              <i className="bi bi-chat-left-text me-2 text-primary"></i>Customer Reviews ({reviews.length})
            </h4>

            {reviews.length === 0 ? (
              <div className="text-center py-4 bg-light rounded-4 border">
                <p className="text-muted small mb-0">No reviews written yet. Be the first to leave a rating!</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => (
                  <div className="border-bottom pb-3" key={rev.id}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-dark small">{rev.user?.full_name || "Verified Customer"}</strong>
                      <span className="text-muted small">
                        {new Date(rev.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="text-warning small mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i key={star} className={`bi ${rev.rating >= star ? "bi-star-fill" : "bi-star"}`}></i>
                      ))}
                    </div>
                    {rev.comment && <p className="text-dark small mb-0">{rev.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Review Form */}
        <div className="col-lg-5">
          <div className="bg-white border rounded-4 p-4 shadow-sm">
            <h5 className="fw-bold text-dark mb-3">Write a Customer Review</h5>
            {user ? (
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Rating (1 to 5 Stars)</label>
                  <div className="d-flex gap-2 text-warning fs-4 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi ${newRating >= star ? "bi-star-fill" : "bi-star"}`}
                        onClick={() => setNewRating(star)}
                        style={{ cursor: "pointer" }}
                      ></i>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Your Review Comment</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tell us what you liked about this product..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="text-center py-3 bg-light rounded-3 border">
                <p className="text-muted small mb-2">Please log in to rate and review this product.</p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm rounded-pill px-4"
                  onClick={() => navigate("/login")}
                >
                  Log In to Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
