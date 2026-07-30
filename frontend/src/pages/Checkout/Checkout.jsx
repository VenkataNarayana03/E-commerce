import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { orderService } from "../../services/orderService.js";
import BackButton from "../../components/BackButton/BackButton.jsx";
import { formatDualPrice } from "../../utils/price.js";

function Checkout() {
  const { items, subtotal, totalItems, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_name: user?.name || "",
    shipping_phone: user?.phone || "",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "India",
    payment_method: "cod",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const shippingFee = subtotal >= 50 || subtotal === 0 ? 0 : 5.99;
  const grandTotal = subtotal + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder(formData);
      setCompletedOrder(order);
      await fetchCart(); // Refresh cart (will be empty now)
      toast.success("Order placed successfully!");
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to place order. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order successfully placed, show Order Confirmation Screen
  if (completedOrder) {
    return (
      <div className="container py-4">
        <div className="bg-white border rounded-4 p-4 p-md-5 text-center shadow-sm max-w-2xl mx-auto">
          <h1 className="h3 font-weight-bold text-success mb-2">Order Confirmed!</h1>
          <p className="text-muted mb-4">
            Thank you for your order, <strong>{completedOrder.shipping_name}</strong>. Your order has been received and is being processed.
          </p>

          <div className="bg-light p-3 rounded-3 text-start mb-4 border">
            <div className="row g-2">
              <div className="col-sm-6">
                <span className="small text-muted d-block">Order Number:</span>
                <strong className="text-dark font-monospace">{completedOrder.order_number}</strong>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block">Payment Method:</span>
                <strong className="text-dark uppercase">{completedOrder.payment_method.toUpperCase()}</strong>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block">Total Amount:</span>
                <strong className="text-primary">{formatDualPrice(completedOrder.total_amount)}</strong>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block">Status:</span>
                <span className="badge bg-success">{completedOrder.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Link to="/orders" className="btn btn-primary rounded-pill px-4 fw-bold">
              View My Orders
            </Link>
            <Link to="/products" className="btn btn-outline-secondary rounded-pill px-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <BackButton />

      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">Checkout</h1>
        <p className="text-muted small">Complete your shipping address and select a payment method.</p>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-warning rounded-3">
          Your cart is empty. <Link to="/products">Browse products</Link> to add items before checking out.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Address & Payment Form */}
            <div className="col-lg-7">
              {/* Shipping Address Section */}
              <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
                <h5 className="fw-bold text-dark mb-3">1. Shipping Address</h5>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="shipping_name"
                      value={formData.shipping_name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="shipping_phone"
                      value={formData.shipping_phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Address Line 1 *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="shipping_address_line1"
                      value={formData.shipping_address_line1}
                      onChange={handleChange}
                      required
                      placeholder="House/Flat No., Building Name, Street"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="shipping_address_line2"
                      value={formData.shipping_address_line2}
                      onChange={handleChange}
                      placeholder="Landmark, Area, Colony"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">City *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      required
                      placeholder="Hyderabad"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">State *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="shipping_state"
                      value={formData.shipping_state}
                      onChange={handleChange}
                      required
                      placeholder="Telangana"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Postal Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="shipping_postal_code"
                      value={formData.shipping_postal_code}
                      onChange={handleChange}
                      required
                      placeholder="500001"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Country</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      name="shipping_country"
                      value={formData.shipping_country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white border rounded-4 p-4 shadow-sm">
                <h5 className="fw-bold text-dark mb-3">2. Payment Method</h5>
                
                <div className="d-flex flex-column gap-3">
                  <label className={`border rounded-3 p-3 d-flex align-items-center cursor-pointer ${formData.payment_method === "cod" ? "border-primary bg-primary-subtle" : ""}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={formData.payment_method === "cod"}
                      onChange={handleChange}
                      className="form-check-input me-3"
                    />
                    <div>
                      <strong className="d-block text-dark">Cash On Delivery (COD)</strong>
                      <small className="text-muted">Pay in cash when your package is delivered.</small>
                    </div>
                  </label>

                  <label className={`border rounded-3 p-3 d-flex align-items-center cursor-pointer ${formData.payment_method === "upi" ? "border-primary bg-primary-subtle" : ""}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="upi"
                      checked={formData.payment_method === "upi"}
                      onChange={handleChange}
                      className="form-check-input me-3"
                    />
                    <div>
                      <strong className="d-block text-dark">UPI / GPay / PhonePe / Paytm</strong>
                      <small className="text-muted">Instant online payment via UPI QR / VPA.</small>
                    </div>
                  </label>

                  <label className={`border rounded-3 p-3 d-flex align-items-center cursor-pointer ${formData.payment_method === "card" ? "border-primary bg-primary-subtle" : ""}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === "card"}
                      onChange={handleChange}
                      className="form-check-input me-3"
                    />
                    <div>
                      <strong className="d-block text-dark">Credit / Debit Card</strong>
                      <small className="text-muted">Pay via Visa, MasterCard, RuPay, or Maestro.</small>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="col-lg-5">
              <div className="bg-white border rounded-4 p-4 shadow-sm sticky-top" style={{ top: "90px" }}>
                <h5 className="fw-bold text-dark mb-3">Order Items ({totalItems})</h5>

                <div className="pe-1 mb-3" style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {items.map((item) => {
                    const prod = item.product || item;
                    return (
                      <div className="d-flex align-items-center gap-3 py-2 border-bottom" key={item.id}>
                        <img
                          src={prod.image_url || "https://via.placeholder.com/60"}
                          alt={prod.name}
                          className="rounded border object-fit-cover"
                          style={{ width: "50px", height: "50px" }}
                        />
                        <div className="flex-grow-1 min-w-0">
                          <h6 className="small fw-semibold text-truncate mb-0">{prod.name}</h6>
                          <small className="text-muted">Qty: {item.quantity}</small>
                        </div>
                        <div className="small fw-bold text-dark">
                          {formatDualPrice(Number(prod.price) * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="d-flex justify-content-between py-2 border-bottom text-muted small">
                  <span>Items Subtotal</span>
                  <span className="fw-bold text-dark">{formatDualPrice(subtotal)}</span>
                </div>

                <div className="d-flex justify-content-between py-2 border-bottom text-muted small">
                  <span>Shipping Fee</span>
                  <span className="fw-bold text-dark">
                    {shippingFee === 0 ? <span className="text-success fw-bold">FREE</span> : formatDualPrice(shippingFee)}
                  </span>
                </div>

                <div className="d-flex justify-content-between pt-3 pb-3 border-top mt-2">
                  <strong className="h5 fw-bold mb-0">Total Amount</strong>
                  <strong className="h5 fw-bold text-primary mb-0">{formatDualPrice(grandTotal)}</strong>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm"
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : (
                    <span>Place Order ({formatDualPrice(grandTotal)}) →</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default Checkout;
