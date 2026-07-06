import { useEffect, useState } from "react";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";

function Dashboard() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/users/me/dashboard")
      .then((response) => setMessage(response.data.message))
      .catch(() => setMessage("Unable to load dashboard details."));
  }, []);

  return (
    <>
      <BackButton />
      <h1 className="h3">Customer Dashboard</h1>
      <div className="bg-white border rounded p-4">
        <p className="mb-1">
          <strong>Name:</strong> {user?.full_name}
        </p>
        <p className="mb-1">
          <strong>Email:</strong> {user?.email}
        </p>
        <p className="mb-0 text-muted">{message}</p>
      </div>
    </>
  );
}

export default Dashboard;
