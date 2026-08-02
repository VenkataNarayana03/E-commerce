import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await login(formData);
      toast.success("Welcome back! Logged in successfully.");
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center mt-2">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="bg-white border-0 rounded-4 shadow-lg p-4 p-sm-5 position-relative overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <div className="position-absolute top-0 start-0 w-100 bg-primary" style={{ height: "6px" }}></div>

            {/* Icon Header */}
            <div className="text-center mb-4">
              <div
                className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                style={{ width: "64px", height: "64px" }}
              >
                <i className="bi bi-person-lock fs-2"></i>
              </div>
              <h1 className="h3 fw-bold text-dark mb-1">Welcome Back</h1>
              <p className="text-muted small mb-0">Sign in to access your orders, saved addresses, and wishlist.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark" htmlFor="email">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    className="form-control bg-light border-start-0 ps-0"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-dark mb-0" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    className="form-control bg-light border-start-0 border-end-0 ps-0"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    className="btn btn-light text-muted border border-start-0"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right fs-5"></i>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Footer Link */}
            <div className="text-center mt-4 border-top pt-3">
              <p className="text-muted small mb-0">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary fw-bold text-decoration-none ms-1">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
