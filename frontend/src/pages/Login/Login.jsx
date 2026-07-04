import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    login({ accessToken: "demo-token", user: { name: "Demo User", role: "customer" } });
    toast.success("Logged in");
    navigate("/");
  };

  return (
    <form className="mx-auto bg-white border rounded p-4" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
      <h1 className="h4 mb-3">Login</h1>
      <label className="form-label" htmlFor="email">Email</label>
      <input className="form-control mb-3" id="email" type="email" required />
      <label className="form-label" htmlFor="password">Password</label>
      <input className="form-control mb-3" id="password" type="password" required />
      <button className="btn btn-primary w-100" type="submit">Login</button>
    </form>
  );
}

export default Login;

