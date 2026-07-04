import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register(formData);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mx-auto bg-white border rounded p-4" style={{ maxWidth: 460 }} onSubmit={handleSubmit}>
      <h1 className="h4 mb-3">Register</h1>
      <label className="form-label" htmlFor="name">Name</label>
      <input
        className="form-control mb-3"
        id="name"
        name="full_name"
        value={formData.full_name}
        onChange={handleChange}
        required
      />
      <label className="form-label" htmlFor="email">Email</label>
      <input
        className="form-control mb-3"
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <label className="form-label" htmlFor="password">Password</label>
      <input
        className="form-control mb-3"
        id="password"
        name="password"
        type="password"
        minLength="8"
        maxLength="72"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}

export default Register;
