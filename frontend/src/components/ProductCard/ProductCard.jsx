import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { formatDualPrice } from "../../utils/price.js";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const imageUrl = product.image_url || product.imageUrl || "https://placehold.co/600x400?text=Product";

  return (
    <div className="card h-100">
      <img
        src={imageUrl}
        className="card-img-top product-card-img"
        alt={product.name}
      />
      <div className="card-body d-flex flex-column">
        <h2 className="h6 card-title">{product.name}</h2>
        <p className="card-text text-muted small flex-grow-1">{product.description}</p>
        {product.category?.name && (
          <span className="badge text-bg-light border align-self-start mb-2">{product.category.name}</span>
        )}
        <div className="d-flex align-items-center justify-content-between">
          <strong>{formatDualPrice(product.price)}</strong>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary btn-sm" to={`/products/${product.id}`}>
              Details
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => addToCart(product)}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
