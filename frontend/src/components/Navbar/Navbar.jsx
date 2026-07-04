import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          Ecommerce
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <div className="navbar-nav me-auto">
            <NavLink className="nav-link" to="/products">
              Products
            </NavLink>
            {user && (
              <NavLink className="nav-link" to="/orders">
                Orders
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink className="nav-link" to="/admin">
                Admin
              </NavLink>
            )}
          </div>
          <div className="navbar-nav align-items-lg-center">
            <NavLink className="nav-link" to="/cart">
              Cart ({itemCount})
            </NavLink>
            {user ? (
              <button className="btn btn-outline-secondary btn-sm ms-lg-2" onClick={logout}>
                Logout
              </button>
            ) : (
              <>
                <NavLink className="nav-link" to="/login">
                  Login
                </NavLink>
                <NavLink className="btn btn-primary btn-sm ms-lg-2" to="/register">
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

