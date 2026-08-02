import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { addressService } from "../../services/addressService.js";
import { orderService } from "../../services/orderService.js";
import { formatDualPrice } from "../../utils/price.js";

function Dashboard() {
  const { user } = useAuth();
  const { totalItems } = useCart();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Address Form State
  const [newAddr, setNewAddr] = useState({
    shipping_name: user?.full_name || "",
    shipping_phone: "",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "India",
  });

  // Load Addresses & Recent Orders from DB on Mount
  const loadAddresses = async () => {
    if (user) {
      try {
        const addrs = await addressService.getAddresses();
        setSavedAddresses(addrs);
      } catch (err) {
        console.error("Failed to load user addresses from DB:", err);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadAddresses();

      setIsLoadingOrders(true);
      try {
        const pastOrdersData = await orderService.getOrders();
        const pastOrders = pastOrdersData.items || pastOrdersData;
        if (Array.isArray(pastOrders)) {
          setRecentOrders(pastOrders.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load dashboard order data:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    loadData();
  }, [user]);

  // Delete saved address in DB
  const handleDeleteAddress = async (addrId) => {
    try {
      if (typeof addrId === "number") {
        await addressService.deleteAddress(addrId);
      }
      setSavedAddresses((prev) => prev.filter((a) => a.id !== addrId));
      toast.info("Saved address removed.");
    } catch (err) {
      toast.error("Failed to delete address.");
    }
  };

  // Set default address in DB
  const handleSetDefaultAddress = async (addrId) => {
    try {
      if (typeof addrId === "number") {
        await addressService.setDefaultAddress(addrId);
        await loadAddresses();
      }
      toast.success("Default address updated.");
    } catch (err) {
      toast.error("Failed to update default address.");
    }
  };

  // Handle Add New Address Form Submission in DB
  const handleAddNewAddressSubmit = async (e) => {
    e.preventDefault();
    if (
      !newAddr.shipping_name ||
      !newAddr.shipping_phone ||
      !newAddr.shipping_address_line1 ||
      !newAddr.shipping_city ||
      !newAddr.shipping_state ||
      !newAddr.shipping_postal_code
    ) {
      toast.error("Please fill in all required address fields.");
      return;
    }

    try {
      await addressService.createAddress({
        ...newAddr,
        shipping_address_line2: newAddr.shipping_address_line2 || null,
        is_default: savedAddresses.length === 0,
      });

      await loadAddresses();
      setShowAddModal(false);
      setNewAddr({
        shipping_name: user?.full_name || "",
        shipping_phone: "",
        shipping_address_line1: "",
        shipping_address_line2: "",
        shipping_city: "",
        shipping_state: "",
        shipping_postal_code: "",
        shipping_country: "India",
      });
      toast.success("New address added to your database profile.");
    } catch (err) {
      toast.error("Failed to save address to database.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-success";
      case "shipped":
      case "out_for_delivery":
        return "bg-info text-dark";
      case "confirmed":
      case "processing":
        return "bg-primary";
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-warning text-dark";
    }
  };

  return (
    <div className="container py-4">
      {/* Profile Welcome Header */}
      <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 shadow-sm" style={{ width: "64px", height: "64px" }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="h4 fw-bold text-dark mb-1">Welcome back, {user?.full_name}!</h1>
              <p className="text-muted small mb-0">
                <i className="bi bi-envelope me-1"></i>{user?.email} • Customer Account
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/orders" className="btn btn-outline-primary rounded-pill px-3 py-2 fw-semibold small">
              <i className="bi bi-box-seam me-1"></i>View All Orders
            </Link>
            <Link to="/products" className="btn btn-primary rounded-pill px-3 py-2 fw-semibold small shadow-sm">
              <i className="bi bi-shop me-1"></i>Start Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="bg-white border rounded-4 p-3 shadow-sm d-flex align-items-center gap-3">
            <div className="bg-primary-subtle text-primary p-3 rounded-circle fs-4">
              <i className="bi bi-box-seam"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Total Orders</span>
              <strong className="h5 fw-bold text-dark mb-0">{recentOrders.length}</strong>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="bg-white border rounded-4 p-3 shadow-sm d-flex align-items-center gap-3">
            <div className="bg-success-subtle text-success p-3 rounded-circle fs-4">
              <i className="bi bi-geo-alt"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Saved Addresses</span>
              <strong className="h5 fw-bold text-dark mb-0">{savedAddresses.length}</strong>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="bg-white border rounded-4 p-3 shadow-sm d-flex align-items-center gap-3">
            <div className="bg-warning-subtle text-warning-emphasis p-3 rounded-circle fs-4">
              <i className="bi bi-cart3"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Cart Items</span>
              <strong className="h5 fw-bold text-dark mb-0">{totalItems}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Addresses Section */}
      <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              <i className="bi bi-geo-alt me-2 text-primary"></i>My Saved Shipping Addresses
            </h5>
            <p className="text-muted small mb-0">Manage your delivery addresses for quick 1-click checkouts.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-pill px-3 fw-semibold shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus-lg me-1"></i>Add New Address
          </button>
        </div>

        {savedAddresses.length === 0 ? (
          <div className="text-center py-4 bg-light rounded-4 border">
            <i className="bi bi-geo-alt display-6 text-muted mb-2 d-block"></i>
            <h6 className="fw-bold text-dark mb-1">No Saved Addresses Yet</h6>
            <p className="text-muted small mb-3">Add a shipping address so you won't need to re-type it during checkout.</p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-4"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i>Add Address Now
            </button>
          </div>
        ) : (
          <div className="row g-3">
            {savedAddresses.map((addr) => (
              <div className="col-12 col-md-6" key={addr.id}>
                <div className={`p-4 border rounded-4 h-100 position-relative ${addr.is_default ? "border-primary bg-primary-subtle shadow-sm" : "bg-light"}`}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <strong className="text-dark h6 mb-0">{addr.shipping_name}</strong>
                    {addr.is_default ? (
                      <span className="badge bg-primary text-white rounded-pill px-2 py-1" style={{ fontSize: "0.7rem" }}>
                        DEFAULT ADDRESS
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-link text-primary p-0 border-0 text-decoration-none small"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => handleSetDefaultAddress(addr.id)}
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  <small className="text-muted d-block mb-1">
                    <i className="bi bi-telephone me-1"></i>{addr.shipping_phone}
                  </small>
                  <small className="text-dark d-block mb-1">
                    {addr.shipping_address_line1}
                    {addr.shipping_address_line2 ? `, ${addr.shipping_address_line2}` : ""}
                  </small>
                  <small className="text-muted d-block mb-3">
                    {addr.shipping_city}, {addr.shipping_state} - {addr.shipping_postal_code}, {addr.shipping_country || "India"}
                  </small>

                  <div className="border-top pt-2 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => handleDeleteAddress(addr.id)}
                    >
                      <i className="bi bi-trash me-1"></i>Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white border rounded-4 p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-clock-history me-2 text-primary"></i>Recent Orders
          </h5>
          {recentOrders.length > 0 && (
            <Link to="/orders" className="text-primary small fw-semibold text-decoration-none">
              View All Orders <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          )}
        </div>

        {isLoadingOrders ? (
          <div className="text-center py-3 text-muted small">Loading recent orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-4 bg-light rounded-4 border">
            <p className="text-muted small mb-2">You haven't placed any orders yet.</p>
            <Link to="/products" className="btn btn-sm btn-primary rounded-pill px-3">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <strong className="font-monospace text-dark small">{ord.order_number}</strong>
                    </td>
                    <td className="small text-muted">
                      {new Date(ord.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border small text-uppercase">{ord.payment_method}</span>
                    </td>
                    <td className="fw-bold text-primary small">{formatDualPrice(ord.total_amount)}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(ord.status)} text-uppercase rounded-pill px-3 py-1`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link to="/orders" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Address Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Add New Shipping Address</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleAddNewAddressSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAddr.shipping_name}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_name: e.target.value }))}
                        required
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newAddr.shipping_phone}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_phone: e.target.value }))}
                        required
                        placeholder="+91 9876543210"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Address Line 1 *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAddr.shipping_address_line1}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_address_line1: e.target.value }))}
                        required
                        placeholder="House/Flat No., Building, Street"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAddr.shipping_address_line2}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_address_line2: e.target.value }))}
                        placeholder="Landmark, Area"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">City *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAddr.shipping_city}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_city: e.target.value }))}
                        required
                        placeholder="Hyderabad"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">State *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAddr.shipping_state}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_state: e.target.value }))}
                        required
                        placeholder="Telangana"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Postal Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newAddr.shipping_postal_code}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_postal_code: e.target.value }))}
                        required
                        placeholder="500001"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Country</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={newAddr.shipping_country}
                        onChange={(e) => setNewAddr((p) => ({ ...p, shipping_country: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
