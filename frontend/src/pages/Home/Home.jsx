import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="py-5">
      <div className="row align-items-center g-4">
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
    </section>
  );
}

export default Home;

