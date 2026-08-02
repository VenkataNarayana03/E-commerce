import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { addressService } from "../../services/addressService.js";
import { orderService } from "../../services/orderService.js";
import { formatDualPrice } from "../../utils/price.js";

function Checkout() {
  const { items, subtotal, totalItems, fetchCart } = useCart();
  const { user } = useAuth();

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    shipping_name: user?.full_name || user?.name || "",
    shipping_phone: user?.phone || "",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "India",
    payment_method: "upi",
  });

  // Payment Phase States
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("Initializing payment session...");
  const [completedOrder, setCompletedOrder] = useState(null);

  // Dummy Card Details State
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "4532 8819 9923 4102",
    cardHolder: user?.full_name ? user.full_name.toUpperCase() : "JOHN DOE",
    expiry: "09/28",
    cvv: "882",
  });

  // Dummy UPI Details State
  const [upiVpa, setUpiVpa] = useState(user?.email ? `${user.email.split("@")[0]}@okaxis` : "user@upi");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const shippingFee = subtotal >= 50 || subtotal === 0 ? 0 : 5.99;
  const grandTotal = subtotal + shippingFee;

  useEffect(() => {
    const initAddresses = async () => {
      let addrs = [];

      if (user) {
        try {
          addrs = await addressService.getAddresses();
        } catch (err) {
          console.error("Failed to load user addresses from DB:", err);
        }
      }

      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        setFormData((prev) => ({
          ...prev,
          shipping_name: defaultAddr.shipping_name,
          shipping_phone: defaultAddr.shipping_phone,
          shipping_address_line1: defaultAddr.shipping_address_line1,
          shipping_address_line2: defaultAddr.shipping_address_line2 || "",
          shipping_city: defaultAddr.shipping_city,
          shipping_state: defaultAddr.shipping_state,
          shipping_postal_code: defaultAddr.shipping_postal_code,
          shipping_country: defaultAddr.shipping_country || "India",
        }));
        setIsAddingNewAddress(false);
      } else {
        setSelectedAddressId("new");
        setIsAddingNewAddress(true);
      }
    };

    initAddresses();
  }, [user]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setIsAddingNewAddress(false);
    setFormData((prev) => ({
      ...prev,
      shipping_name: addr.shipping_name,
      shipping_phone: addr.shipping_phone,
      shipping_address_line1: addr.shipping_address_line1,
      shipping_address_line2: addr.shipping_address_line2 || "",
      shipping_city: addr.shipping_city,
      shipping_state: addr.shipping_state,
      shipping_postal_code: addr.shipping_postal_code,
      shipping_country: addr.shipping_country || "India",
    }));
  };

  const handleSwitchToNewAddress = () => {
    setSelectedAddressId("new");
    setIsAddingNewAddress(true);
    setFormData((prev) => ({
      ...prev,
      shipping_name: user?.full_name || "",
      shipping_phone: user?.phone || "",
      shipping_address_line1: "",
      shipping_address_line2: "",
      shipping_city: "",
      shipping_state: "",
      shipping_postal_code: "",
      shipping_country: "India",
    }));
  };

  const handleDeleteAddress = async (e, addrId) => {
    e.stopPropagation();
    try {
      if (user && typeof addrId === "number") {
        await addressService.deleteAddress(addrId);
      }
      const updated = savedAddresses.filter((a) => a.id !== addrId);
      setSavedAddresses(updated);
      if (selectedAddressId === addrId) {
        if (updated.length > 0) {
          handleSelectSavedAddress(updated[0]);
        } else {
          handleSwitchToNewAddress();
        }
      }
      toast.info("Saved address removed.");
    } catch (err) {
      toast.error("Failed to delete address.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (
      !formData.shipping_name ||
      !formData.shipping_phone ||
      !formData.shipping_address_line1 ||
      !formData.shipping_city ||
      !formData.shipping_state ||
      !formData.shipping_postal_code
    ) {
      toast.error("Please fill in all required shipping address fields.");
      return;
    }
    setStep(2);
  };

  const handleAutoFillCard = () => {
    setCardDetails({
      cardNumber: "4000 1234 5678 9010",
      cardHolder: formData.shipping_name ? formData.shipping_name.toUpperCase() : "TEST USER",
      expiry: "12/29",
      cvv: "321",
    });
    toast.info("Auto-filled test card details");
  };

  const handleCardNumberChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    let formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardDetails((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExecutePayment = async () => {
    setStep(3);
    setIsSubmitting(true);

    try {
      setProcessingStatus("Connecting to Payment Gateway...");
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStatus(`Authorizing payment via ${formData.payment_method.toUpperCase()}...`);
      await new Promise((r) => setTimeout(r, 700));

      setProcessingStatus("Payment Approved! Placing your order...");
      await new Promise((r) => setTimeout(r, 600));

      if (saveForFuture && user) {
        try {
          await addressService.createAddress({
            shipping_name: formData.shipping_name,
            shipping_phone: formData.shipping_phone,
            shipping_address_line1: formData.shipping_address_line1,
            shipping_address_line2: formData.shipping_address_line2 || null,
            shipping_city: formData.shipping_city,
            shipping_state: formData.shipping_state,
            shipping_postal_code: formData.shipping_postal_code,
            shipping_country: formData.shipping_country || "India",
            is_default: savedAddresses.length === 0,
          });
        } catch (err) {
          console.error("Failed to save address to DB:", err);
        }
      }

      const order = await orderService.createOrder(formData);
      setCompletedOrder(order);
      await fetchCart();

      toast.success("Payment successful! Order placed.");
      setStep(4);
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to process payment. Please try again.";
      toast.error(msg);
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 4 && completedOrder) {
    return (
      <div className="container py-5">
        <div className="bg-white border rounded-4 p-4 p-md-5 text-center shadow-sm max-w-2xl mx-auto position-relative overflow-hidden">
          <div className="mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle p-3 mb-3 shadow-sm" style={{ width: "72px", height: "72px" }}>
              <i className="bi bi-check-lg display-5 fw-bold"></i>
            </div>
            <h1 className="h3 fw-bold text-success mb-2">Order Payment Confirmed!</h1>
            <p className="text-muted">
              Thank you for shopping with us, <strong>{completedOrder.shipping_name}</strong>. Your payment was verified and your order is being processed.
            </p>
          </div>

          <div className="bg-light p-4 rounded-4 text-start mb-4 border">
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="small text-muted d-block fw-semibold">Order Number</span>
                <strong className="text-dark font-monospace h6">{completedOrder.order_number}</strong>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block fw-semibold">Payment Status</span>
                <span className="badge bg-success px-3 py-2 rounded-pill">PAID & CONFIRMED</span>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block fw-semibold">Payment Method</span>
                <strong className="text-dark text-uppercase">{completedOrder.payment_method.toUpperCase()}</strong>
              </div>
              <div className="col-sm-6">
                <span className="small text-muted d-block fw-semibold">Total Paid</span>
                <strong className="text-primary h6 fw-bold">{formatDualPrice(completedOrder.total_amount)}</strong>
              </div>
              <div className="col-12 border-top pt-2 mt-2">
                <span className="small text-muted d-block fw-semibold">Delivery Address</span>
                <span className="small text-dark">
                  {completedOrder.shipping_address_line1}, {completedOrder.shipping_address_line2 ? `${completedOrder.shipping_address_line2}, ` : ""}
                  {completedOrder.shipping_city}, {completedOrder.shipping_state} - {completedOrder.shipping_postal_code}, {completedOrder.shipping_country}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Link to="/orders" className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold shadow-sm">
              <i className="bi bi-box-seam me-2"></i>View My Orders
            </Link>
            <Link to="/products" className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-semibold">
              <i className="bi bi-shop me-2"></i>Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header & Step Indicator */}
      <div className="text-center mb-4">
        <h1 className="h3 fw-bold text-dark mb-2">Checkout & Payment</h1>
        <p className="text-muted small">Complete shipping details and payment to place your order.</p>

        <div className="checkout-steps mt-4">
          <div className={`step-item ${step === 1 ? "active" : "completed"}`}>
            <div className="step-number">{step > 1 ? <i className="bi bi-check"></i> : "1"}</div>
            <span>1. Shipping Details</span>
          </div>
          <div className={`step-divider ${step > 1 ? "active" : ""}`}></div>
          <div className={`step-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`}>
            <div className="step-number">{step > 2 ? <i className="bi bi-check"></i> : "2"}</div>
            <span>2. Payment Phase</span>
          </div>
          <div className={`step-divider ${step === 4 ? "active" : ""}`}></div>
          <div className={`step-item ${step === 4 ? "completed" : ""}`}>
            <div className="step-number">3</div>
            <span>3. Order Placed</span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-warning rounded-3 text-center p-4">
          <h5>Your Cart is Empty</h5>
          <p className="text-muted small mb-3">Add some products to your cart before proceeding to checkout.</p>
          <Link to="/products" className="btn btn-primary rounded-pill px-4">Browse Products</Link>
        </div>
      ) : (
        <form onSubmit={handleProceedToPayment}>
          <div className="row g-4">
            {/* Main Content Area */}
            <div className="col-lg-7">
              {/* Shipping Address Section */}
              <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">1. Shipping Address</h5>
                  {step === 2 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill"
                      onClick={() => setStep(1)}
                    >
                      <i className="bi bi-pencil me-1"></i>Change Address
                    </button>
                  )}
                </div>

                {/* SAVED ADDRESS SELECTOR GRID */}
                {step === 1 && savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-muted mb-2">Select a Saved Address:</label>
                    <div className="row g-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id && !isAddingNewAddress;
                        return (
                          <div className="col-12 col-md-6" key={addr.id}>
                            <div
                              className={`p-3 border rounded-3 h-100 cursor-pointer position-relative transition-all ${
                                isSelected ? "border-primary bg-primary-subtle shadow-sm" : "bg-light"
                              }`}
                              onClick={() => handleSelectSavedAddress(addr)}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <strong className="text-dark">{addr.shipping_name}</strong>
                                <div className="d-flex align-items-center gap-1">
                                  {addr.is_default && (
                                    <span className="badge bg-primary text-white" style={{ fontSize: "0.65rem" }}>
                                      DEFAULT
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-link text-danger p-0 border-0 ms-1 opacity-75 hover-opacity-100"
                                    style={{ fontSize: "0.85rem" }}
                                    onClick={(e) => handleDeleteAddress(e, addr.id)}
                                    title="Delete saved address"
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              </div>
                              <small className="text-muted d-block mb-1">
                                <i className="bi bi-telephone me-1"></i>{addr.shipping_phone}
                              </small>
                              <small className="text-dark d-block">
                                {addr.shipping_address_line1}
                                {addr.shipping_address_line2 ? `, ${addr.shipping_address_line2}` : ""}
                              </small>
                              <small className="text-muted d-block">
                                {addr.shipping_city}, {addr.shipping_state} - {addr.shipping_postal_code}
                              </small>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add New Address Card Option */}
                      <div className="col-12 col-md-6">
                        <div
                          className={`p-3 border border-dashed rounded-3 h-100 d-flex flex-column align-items-center justify-content-center cursor-pointer text-center ${
                            isAddingNewAddress ? "border-primary bg-light" : "bg-white"
                          }`}
                          onClick={handleSwitchToNewAddress}
                          style={{ minHeight: "110px" }}
                        >
                          <i className="bi bi-plus-circle fs-5 text-primary mb-1"></i>
                          <strong className="small text-primary">Add New Address</strong>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>Type a different delivery address</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADDRESS EDIT/INPUT FORM */}
                {(isAddingNewAddress || savedAddresses.length === 0) && (
                  <fieldset disabled={step === 2}>
                    {savedAddresses.length > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-primary mb-0">Enter New Address Details</h6>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-secondary text-decoration-none"
                          onClick={() => handleSelectSavedAddress(savedAddresses[0])}
                        >
                          <i className="bi bi-arrow-left me-1"></i>Select Saved Address
                        </button>
                      </div>
                    )}

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
                          placeholder="House/Flat No., Street, Area"
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
                          placeholder="Landmark, Apartment Name"
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

                      <div className="col-12 mt-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="saveForFutureCheck"
                            checked={saveForFuture}
                            onChange={(e) => setSaveForFuture(e.target.checked)}
                          />
                          <label className="form-check-label small text-muted" htmlFor="saveForFutureCheck">
                            Save this address to my account for faster future checkout
                          </label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                )}
              </div>

              {/* Payment Method Selection Section */}
              <div className="bg-white border rounded-4 p-4 shadow-sm">
                <h5 className="fw-bold text-dark mb-3">2. Select Payment Method</h5>

                <div className="row g-3">
                  {/* UPI Option */}
                  <div className="col-12">
                    <div
                      className={`payment-card-option d-flex align-items-center ${formData.payment_method === "upi" ? "selected" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, payment_method: "upi" }))}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="upi"
                        checked={formData.payment_method === "upi"}
                        onChange={handleChange}
                        className="form-check-input me-3"
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <strong className="text-dark">
                            <i className="bi bi-qr-code-scan me-2 text-primary"></i>UPI / GPay / PhonePe / Paytm
                          </strong>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Recommended</span>
                        </div>
                        <small className="text-muted d-block">Instant payment via UPI QR code or VPA ID.</small>
                      </div>
                    </div>
                  </div>

                  {/* Card Option */}
                  <div className="col-12">
                    <div
                      className={`payment-card-option d-flex align-items-center ${formData.payment_method === "card" ? "selected" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, payment_method: "card" }))}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="card"
                        checked={formData.payment_method === "card"}
                        onChange={handleChange}
                        className="form-check-input me-3"
                      />
                      <div className="flex-grow-1">
                        <strong className="text-dark d-block">
                          <i className="bi bi-credit-card-2-front me-2 text-primary"></i>Credit / Debit Card
                        </strong>
                        <small className="text-muted">Visa, Mastercard, RuPay, Maestro.</small>
                      </div>
                    </div>
                  </div>

                  {/* Net Banking Option */}
                  <div className="col-12">
                    <div
                      className={`payment-card-option d-flex align-items-center ${formData.payment_method === "netbanking" ? "selected" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, payment_method: "netbanking" }))}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="netbanking"
                        checked={formData.payment_method === "netbanking"}
                        onChange={handleChange}
                        className="form-check-input me-3"
                      />
                      <div className="flex-grow-1">
                        <strong className="text-dark d-block">
                          <i className="bi bi-bank me-2 text-primary"></i>Net Banking
                        </strong>
                        <small className="text-muted">All major Indian banks (SBI, HDFC, ICICI, Axis).</small>
                      </div>
                    </div>
                  </div>

                  {/* Cash on Delivery Option */}
                  <div className="col-12">
                    <div
                      className={`payment-card-option d-flex align-items-center ${formData.payment_method === "cod" ? "selected" : ""}`}
                      onClick={() => setFormData((p) => ({ ...p, payment_method: "cod" }))}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={formData.payment_method === "cod"}
                        onChange={handleChange}
                        className="form-check-input me-3"
                      />
                      <div className="flex-grow-1">
                        <strong className="text-dark d-block">
                          <i className="bi bi-cash-stack me-2 text-primary"></i>Cash On Delivery (COD)
                        </strong>
                        <small className="text-muted">Pay in cash when package arrives at your doorstep.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="col-lg-5">
              <div className="bg-white border rounded-4 p-4 shadow-sm sticky-top" style={{ top: "90px" }}>
                <h5 className="fw-bold text-dark mb-3">Order Summary ({totalItems} items)</h5>

                <div className="pe-1 mb-3" style={{ maxHeight: "260px", overflowY: "auto" }}>
                  {items.map((item) => {
                    const prod = item.product || item;
                    return (
                      <div className="d-flex align-items-center gap-3 py-2 border-bottom" key={item.id}>
                        <img
                          src={prod.image_url || "https://via.placeholder.com/60"}
                          alt={prod.name}
                          className="rounded border object-fit-cover"
                          style={{ width: "48px", height: "48px" }}
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

                {step === 1 ? (
                  <button
                    type="submit"
                    className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm"
                  >
                    Proceed to Payment Phase ({formatDualPrice(grandTotal)}) <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success w-100 rounded-pill py-3 fw-bold shadow-sm"
                    onClick={() => setStep(2)}
                  >
                    Open Payment Gateway <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* --- DUMMY PAYMENT GATEWAY MODAL (Step 2) --- */}
      {step === 2 && (
        <div className="gateway-overlay">
          <div className="gateway-modal-card">
            {/* Gateway Header */}
            <div className="gateway-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-shield-lock me-2"></i>Secure Payment Gateway
                </h5>
                <small className="opacity-75">Simulated Payment Checkout Stage</small>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setStep(1)}
              ></button>
            </div>

            <div className="p-4">
              {/* Total Amount Badge */}
              <div className="bg-primary-subtle border border-primary-subtle rounded-3 p-3 mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted d-block">Amount Payable</small>
                  <strong className="text-primary h5 fw-bold mb-0">{formatDualPrice(grandTotal)}</strong>
                </div>
                <span className="badge bg-primary px-3 py-2 text-uppercase">{formData.payment_method}</span>
              </div>

              {/* PAYMENT METHOD SPECIFIC INTERFACE */}

              {/* 1. UPI Payment Interface */}
              {formData.payment_method === "upi" && (
                <div>
                  <div className="text-center mb-4">
                    <div className="bg-light p-3 rounded-4 d-inline-block border shadow-sm mb-2">
                      <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="white"/>
                        <path d="M10 10H40V40H10V10ZM20 20V30H30V20H20Z" fill="#1e293b"/>
                        <path d="M60 10H90V40H60V10ZM70 20V30H80V20H70Z" fill="#1e293b"/>
                        <path d="M10 60H40V90H10V60ZM20 70V80H30V70H20Z" fill="#1e293b"/>
                        <rect x="45" y="10" width="10" height="25" fill="#1e293b"/>
                        <rect x="45" y="45" width="20" height="10" fill="#1e293b"/>
                        <rect x="70" y="45" width="20" height="20" fill="#1e293b"/>
                        <rect x="45" y="60" width="10" height="30" fill="#1e293b"/>
                        <rect x="60" y="70" width="30" height="20" fill="#1e293b"/>
                      </svg>
                    </div>
                    <small className="text-muted d-block">Scan QR code using GPay, PhonePe, Paytm, or BHIM</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Or enter Virtual Payment Address (VPA / UPI ID)</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="username@upi"
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => {
                          setUpiVpa("demo.user@okicici");
                          toast.info("Demo UPI ID set!");
                        }}
                      >
                        Auto-fill
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Credit/Debit Card Interface */}
              {formData.payment_method === "card" && (
                <div>
                  <div className="visual-credit-card mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="visual-card-chip"></div>
                      <span className="fw-bold tracking-widest text-uppercase small opacity-75">Debit / Credit</span>
                    </div>
                    <div className="visual-card-number my-2">
                      {cardDetails.cardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="d-flex justify-content-between align-items-end">
                      <div>
                        <div className="small opacity-75 text-uppercase" style={{ fontSize: "0.65rem" }}>Card Holder</div>
                        <div className="fw-semibold small">{cardDetails.cardHolder || "YOUR NAME"}</div>
                      </div>
                      <div>
                        <div className="small opacity-75 text-uppercase" style={{ fontSize: "0.65rem" }}>Expires</div>
                        <div className="fw-semibold small">{cardDetails.expiry || "MM/YY"}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary w-100 mb-3 rounded-pill"
                    onClick={handleAutoFillCard}
                  >
                    <i className="bi bi-magic me-1"></i>Auto-fill Test Card Details
                  </button>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Card Number</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={cardDetails.cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength="19"
                        placeholder="4532 8819 9923 4102"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Cardholder Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={cardDetails.cardHolder}
                        onChange={(e) => setCardDetails((p) => ({ ...p, cardHolder: e.target.value.toUpperCase() }))}
                        placeholder="JOHN DOE"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Expiry Date</label>
                      <input
                        type="text"
                        className="form-control"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails((p) => ({ ...p, expiry: e.target.value }))}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">CVV / CVC</label>
                      <input
                        type="password"
                        className="form-control"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails((p) => ({ ...p, cvv: e.target.value }))}
                        placeholder="123"
                        maxLength="4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Net Banking Interface */}
              {formData.payment_method === "netbanking" && (
                <div>
                  <label className="form-label small fw-semibold mb-2">Select Your Bank</label>
                  <div className="row g-2 mb-3">
                    {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank", "PNB"].map((bank) => (
                      <div className="col-6" key={bank}>
                        <button
                          type="button"
                          className={`btn btn-sm w-100 text-start p-2.5 border rounded-3 ${selectedBank === bank ? "btn-primary" : "btn-light"}`}
                          onClick={() => setSelectedBank(bank)}
                        >
                          <i className="bi bi-bank me-1"></i>{bank}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="alert alert-info py-2 small rounded-3">
                    Selected Bank: <strong>{selectedBank}</strong>. You will simulate a net banking authorization.
                  </div>
                </div>
              )}

              {/* 4. Cash On Delivery Interface */}
              {formData.payment_method === "cod" && (
                <div className="text-center py-3">
                  <div className="display-4 text-warning mb-2">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <h6 className="fw-bold">Pay Cash Upon Delivery</h6>
                  <p className="text-muted small">
                    No online transfer required right now. Please have exact cash ready when package arrives.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 mt-4 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 fw-semibold"
                  onClick={() => setStep(1)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success flex-grow-1 rounded-pill py-2.5 fw-bold shadow"
                  onClick={handleExecutePayment}
                >
                  Confirm & Pay ({formatDualPrice(grandTotal)})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT PROCESSING LOADER OVERLAY (Step 3) --- */}
      {step === 3 && (
        <div className="gateway-overlay">
          <div className="bg-white rounded-4 p-5 text-center shadow-lg" style={{ maxWidth: "420px", width: "100%" }}>
            <div className="d-flex justify-content-center mb-4">
              <div className="pulse-spinner"></div>
            </div>
            <h5 className="fw-bold text-dark mb-2">Processing Payment...</h5>
            <p className="text-primary fw-semibold small mb-4">{processingStatus}</p>
            <div className="progress rounded-pill mb-3" style={{ height: "8px" }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                role="progressbar"
                style={{ width: "100%" }}
              ></div>
            </div>
            <small className="text-muted">Please do not refresh or close this page.</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
