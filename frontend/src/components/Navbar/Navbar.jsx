import { Link, NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const itemCount = totalItems || 0;

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="sticky-top bg-white border-bottom shadow-sm">
      <nav className="navbar navbar-expand-lg navbar-light py-2.5">
        <div className="container">
          {/* Brand Logo */}
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark fs-4" to="/">
            <div
              className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "38px", height: "38px" }}
            >
              <i className="bi bi-bag-check-fill fs-5"></i>
            </div>
            <span className="tracking-tight">
              <span className="text-primary fw-bold">E</span>Commerce
            </span>
          </Link>

          {/* Mobile Toggler */}
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Nav Links */}
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
              <li className="nav-item">
                <NavLink className="nav-link px-3 py-2 rounded-pill fw-medium" to="/products">
                  <i className="bi bi-grid me-1.5 opacity-75"></i>Products
                </NavLink>
              </li>

              {user && (
                <li className="nav-item">
                  <NavLink className="nav-link px-3 py-2 rounded-pill fw-medium" to="/dashboard">
                    <i className="bi bi-speedometer2 me-1.5 opacity-75"></i>Dashboard
                  </NavLink>
                </li>
              )}

              {user && (
                <li className="nav-item">
                  <NavLink className="nav-link px-3 py-2 rounded-pill fw-medium" to="/orders">
                    <i className="bi bi-box-seam me-1.5 opacity-75"></i>Orders
                  </NavLink>
                </li>
              )}

              {user && (
                <li className="nav-item">
                  <NavLink className="nav-link px-3 py-2 rounded-pill fw-medium" to="/wishlist">
                    <i className="bi bi-heart me-1.5 opacity-75"></i>Wishlist
                  </NavLink>
                </li>
              )}

              {user?.role === "admin" && (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 py-2 rounded-pill fw-medium" to="/admin">
                      <i className="bi bi-shield-lock me-1.5 opacity-75"></i>Admin
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 py-2 rounded-pill fw-medium" to="/admin/users">
                      <i className="bi bi-people me-1.5 opacity-75"></i>Users
                    </NavLink>
                  </li>
                </>
              )}
            </ul>

            {/* Right Action Bar */}
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              {/* Cart Button */}
              <NavLink
                to="/cart"
                className="btn btn-light border rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 fw-semibold shadow-sm text-dark position-relative me-1"
              >
                <i className="bi bi-cart3 text-primary fs-6"></i>
                <span className="small">Cart</span>
                <span className={`badge rounded-pill ${itemCount > 0 ? "bg-primary text-white" : "bg-secondary text-white"}`} style={{ fontSize: "0.75rem" }}>
                  {itemCount}
                </span>
              </NavLink>

              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <div className="d-none d-xl-flex align-items-center gap-2 px-2 py-1 bg-light rounded-pill border">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold small" style={{ width: "28px", height: "28px" }}>
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="small fw-semibold text-dark me-1">{user.full_name?.split(" ")[0]}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <NavLink to="/login" className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 fw-semibold">
                    Login
                  </NavLink>
                  <NavLink to="/register" className="btn btn-primary btn-sm rounded-pill px-3.5 py-1.5 fw-bold shadow-sm">
                    Register
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
