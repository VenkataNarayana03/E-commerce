import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";
import { formatDualPrice } from "../../utils/price.js";

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
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
    addToCart(product);
    toast.success("Added to cart");
  };

  if (isLoading) {
    return <p className="text-muted">Loading product...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <>
      <BackButton />
      <div className="row g-4 align-items-start">
      <div className="col-lg-6">
        <img
          className="img-fluid rounded border bg-white"
          src={product.image_url || "https://placehold.co/900x600?text=Product"}
          alt={product.name}
        />
      </div>
      <div className="col-lg-6">
        <span className="badge text-bg-light border mb-2">{product.category.name}</span>
        <h1 className="h3">{product.name}</h1>
        <p className="text-muted">{product.description}</p>
        <p className="h4">{formatDualPrice(product.price)}</p>
        <p className={product.stock_quantity > 0 ? "text-success" : "text-danger"}>
          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
        </p>
        <button className="btn btn-primary" onClick={handleAdd} disabled={product.stock_quantity === 0}>
          Add to Cart
        </button>
      </div>
      </div>
    </>
  );
}

export default ProductDetails;
