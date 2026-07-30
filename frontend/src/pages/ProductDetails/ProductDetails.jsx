import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";
import { formatDualPrice } from "../../utils/price.js";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart, loading } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [id]);

  const handleAdd = () => {
    if (product) {
      addToCart(product, quantity);
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
        <BackButton />
        <div className="alert alert-danger rounded-3 mt-3">{error || "Product not found."}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <BackButton />
      
      <div className="row g-4 align-items-start mt-1">
        <div className="col-lg-6">
          <div className="bg-white p-3 border rounded-4 shadow-sm text-center">
            <img
              className="img-fluid rounded-3 object-fit-cover w-100"
              style={{ maxHeight: "450px" }}
              src={product.image_url || "https://placehold.co/900x600?text=Product"}
              alt={product.name}
            />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="bg-white p-4 border rounded-4 shadow-sm">
            <span className="badge bg-light text-primary border mb-2 px-3 py-2 rounded-pill fw-semibold">
              {product.category?.name || "General"}
            </span>
            <h1 className="h2 fw-bold text-dark mb-3">{product.name}</h1>
            <h3 className="text-primary fw-bold mb-3">{formatDualPrice(product.price)}</h3>
            
            <p className="text-muted mb-4" style={{ lineHeight: "1.6" }}>
              {product.description || "No detailed description available."}
            </p>

            <div className="mb-4">
              <span className={`fw-bold small px-3 py-1 rounded-pill ${product.stock_quantity > 0 ? "bg-success-subtle text-success border border-success" : "bg-danger-subtle text-danger border border-danger"}`}>
                {product.stock_quantity > 0 ? `✓ In Stock (${product.stock_quantity} available)` : "Out of Stock"}
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

            <div className="d-flex gap-3">
              <button
                className="btn btn-primary btn-lg rounded-pill px-4 fw-bold shadow-sm flex-grow-1"
                onClick={handleAdd}
                disabled={product.stock_quantity === 0 || loading}
              >
                🛒 Add to Cart
              </button>
              <Link to="/cart" className="btn btn-outline-secondary btn-lg rounded-pill px-4 fw-semibold">
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
