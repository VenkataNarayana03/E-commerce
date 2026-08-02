import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderService } from "../../services/orderService.js";
import { formatDualPrice } from "../../utils/price.js";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    orderService
      .getOrders()
      .then((data) => {
        setOrders(data.items || []);
        setError("");
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || "Failed to load orders.";
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, []);

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

  const getStageIndex = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return 1;
      case "processing":
        return 2;
      case "shipped":
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 1;
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">My Orders</h1>
          <p className="text-muted small mb-0">Track and view live database history of your placed orders.</p>
        </div>
        <Link to="/products" className="btn btn-outline-primary btn-sm rounded-pill px-3">
          <i className="bi bi-plus-lg me-1"></i>New Order
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading orders...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger rounded-3">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-5 bg-white border rounded-4 shadow-sm">
          <h3 className="h4 text-dark mb-2">No orders placed yet</h3>
          <p className="text-muted mb-4">You haven't placed any orders with us yet.</p>
          <Link to="/products" className="btn btn-primary rounded-pill px-4 shadow-sm">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((order) => {
            const currentStage = getStageIndex(order.status);
            const isCancelled = currentStage === -1;

            return (
              <div className="bg-white border rounded-4 p-4 shadow-sm" key={order.id}>
                {/* Order Header */}
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-bottom pb-3 mb-3 gap-2">
                  <div>
                    <span className="text-muted small d-block">Order ID</span>
                    <strong className="text-dark font-monospace h6 mb-0">{order.order_number}</strong>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Date</span>
                    <strong className="text-dark small">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Payment Method</span>
                    <span className="badge bg-light text-dark border small text-uppercase">
                      {order.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted small d-block mb-1">Status</span>
                    <span className={`badge ${getStatusBadge(order.status)} text-uppercase px-3 py-1 rounded-pill`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* VISUAL ORDER TRACKING TIMELINE */}
                {!isCancelled ? (
                  <div className="bg-light p-3 rounded-4 mb-4 border">
                    <div className="d-flex justify-content-between align-items-center position-relative">
                      {/* Step 1: Confirmed */}
                      <div className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-1 ${currentStage >= 1 ? "bg-primary" : "bg-secondary opacity-50"}`} style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>
                          {currentStage >= 1 ? "✓" : "1"}
                        </div>
                        <div className="small fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Order Confirmed</div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-1 ${currentStage >= 2 ? "bg-primary" : "bg-secondary opacity-50"}`} style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>
                          {currentStage >= 2 ? "✓" : "2"}
                        </div>
                        <div className="small fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Processing</div>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-1 ${currentStage >= 3 ? "bg-primary" : "bg-secondary opacity-50"}`} style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>
                          {currentStage >= 3 ? "✓" : "3"}
                        </div>
                        <div className="small fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Shipped</div>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold mb-1 ${currentStage >= 4 ? "bg-success" : "bg-secondary opacity-50"}`} style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>
                          {currentStage >= 4 ? "✓" : "4"}
                        </div>
                        <div className="small fw-semibold text-dark" style={{ fontSize: "0.75rem" }}>Delivered</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-danger py-2 rounded-3 small mb-3">
                    <i className="bi bi-x-circle me-1"></i>This order was cancelled.
                  </div>
                )}

                {/* Order Items Table */}
                <div className="mb-3">
                  <h6 className="fw-bold text-dark small mb-2">Items Ordered:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light small">
                        <tr>
                          <th>Product</th>
                          <th className="text-center">Price</th>
                          <th className="text-center">Qty</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="fw-semibold">{item.product_name}</td>
                            <td className="text-center text-muted small">{formatDualPrice(item.unit_price)}</td>
                            <td className="text-center fw-bold">{item.quantity}</td>
                            <td className="text-end fw-bold">{formatDualPrice(item.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Footer & Shipping Details */}
                <div className="bg-light p-3 rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div className="small text-muted">
                    <strong>Ship To:</strong> {order.shipping_name}, {order.shipping_address_line1}, {order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}
                  </div>
                  <div className="text-md-end">
                    <div className="small text-muted">Total Paid</div>
                    <div className="h5 fw-bold text-primary mb-0">{formatDualPrice(order.total_amount)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;
