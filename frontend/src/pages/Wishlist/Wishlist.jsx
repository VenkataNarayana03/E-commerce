import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { wishlistService } from "../../services/wishlistService.js";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";

function Wishlist() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  return (
    <div className="container py-4">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">My Wishlist</h1>
          <p className="text-muted small mb-0">Your saved favorite products stored in database.</p>
        </div>
        <Link to="/products" className="btn btn-outline-primary btn-sm rounded-pill px-3">
          Explore More Products
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading wishlist...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-5 bg-white border rounded-4 shadow-sm">
          <h3 className="h5 text-dark mb-2">Your wishlist is empty</h3>
          <p className="text-muted small mb-4">Explore our catalog and save your favorite products.</p>
          <Link to="/products" className="btn btn-primary rounded-pill px-4 shadow-sm">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((item) => (
            <div className="col-sm-6 col-lg-3" key={item.id}>
              <ProductCard product={item.product} onWishlistToggle={loadWishlist} isInitiallyWishlisted={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
