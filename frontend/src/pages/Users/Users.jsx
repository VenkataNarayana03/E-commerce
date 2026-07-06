import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import BackButton from "../../components/BackButton/BackButton.jsx";

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setIsLoading(true);
    api
      .get("/admin/users")
      .then((response) => setUsers(response.data))
      .catch(() => {
        toast.error("Unable to load users");
        setUsers([]);
      })
      .finally(() => setIsLoading(false));
  };

  const handleUserAction = async (userId, updates) => {
    try {
      await api.put(`/admin/users/${userId}`, updates);
      toast.success("User updated");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to update user");
    }
  };

  const handleUserDelete = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to delete user");
    }
  };

  return (
    <>
      <BackButton />
      <div className="bg-white border rounded p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Users</h1>
      </div>
      {isLoading ? (
        <p className="text-muted">Loading users...</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td>{userItem.full_name}</td>
                  <td>{userItem.email}</td>
                  <td>{userItem.role}</td>
                  <td>{userItem.is_blocked ? "Blocked" : userItem.is_active ? "Active" : "Inactive"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={() => handleUserAction(userItem.id, { is_blocked: !userItem.is_blocked })}
                    >
                      {userItem.is_blocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={() => handleUserAction(userItem.id, { role: userItem.role === "admin" ? "customer" : "admin" })}
                    >
                      {userItem.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleUserDelete(userItem.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </>
  );
}

export default Users;
