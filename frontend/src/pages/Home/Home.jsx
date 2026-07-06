import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import api from "../../services/api.js";

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    api
      .get("/products", { params: { page_size: 4, sort: "newest" } })
      .then((response) => setFeaturedProducts(response.data.items))
      .catch(() => setFeaturedProducts([]));
  }, []);

  return (
    <section className="py-5">
      <div className="row align-items-center g-4 mb-5">
        <div className="col-lg-7">
          <h1 className="display-5 fw-semibold">Ecommerce Store</h1>
          <p className="lead text-muted">
            A React and FastAPI ecommerce starter ready for products, cart,
            checkout, orders, and admin workflows.
          </p>
          <Link className="btn btn-primary" to="/products">
            Browse Products
          </Link>
        </div>
      </div>

      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Featured Products</h2>
          <Link className="btn btn-outline-secondary btn-sm" to="/products">
            View All
          </Link>
        </div>
        <div className="row g-4">
          {featuredProducts.map((product) => (
            <div className="col-sm-6 col-lg-3" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Home;

