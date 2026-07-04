import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";

function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div className="card h-100">
      <img
        src={product.imageUrl || "https://placehold.co/600x400?text=Product"}
        className="card-img-top product-card-img"
        alt={product.name}
      />
      <div className="card-body d-flex flex-column">
        <h2 className="h6 card-title">{product.name}</h2>
        <p className="card-text text-muted small flex-grow-1">{product.description}</p>
        <div className="d-flex align-items-center justify-content-between">
          <strong>${product.price}</strong>
          <button className="btn btn-primary btn-sm" onClick={() => addToCart(product)}>
            Add
          </button>
        </div>
        <Link className="stretched-link visually-hidden" to={`/products/${product.id}`}>
          View details
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;

