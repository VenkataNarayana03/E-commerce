import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatDualPrice } from "../../utils/price.js";

function Cart() {
  const { items, subtotal, totalItems, increaseQuantity, decreaseQuantity, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shippingCost = subtotal > 50 || subtotal === 0 ? 0 : 5.99;
  const grandTotal = subtotal + shippingCost;

  const handleCheckoutClick = () => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="container py-4">
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Shopping Cart</h1>
          <p className="text-muted small mb-0">
            {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        {items.length > 0 && (
          <button 
            className="btn btn-outline-danger btn-sm rounded-pill px-3" 
            onClick={clearCart} 
            disabled={loading}
          >
            Clear Cart
          </button>
        )}
      </div>

      {!user && items.length > 0 && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between rounded-3 shadow-sm mb-4" role="alert">
          <div>
            <strong>Guest Mode:</strong> Please log in or create an account to proceed to checkout and place your order.
          </div>
          <Link to="/login?redirect=/cart" className="btn btn-warning btn-sm fw-bold px-3 text-dark">
            Login Now
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 border shadow-sm my-3">
          <h3 className="h4 text-dark mb-2">Your cart is empty</h3>
          <p className="text-muted mb-4">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {/* Cart Items List */}
          <div className="col-lg-8">
            <div className="bg-white border rounded-4 p-3 p-md-4 shadow-sm">
              {items.map((item) => {
                const prod = item.product || item;
                const itemTotal = Number(prod.price) * item.quantity;

                return (
                  <div 
                    className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-bottom py-3 gap-3" 
                    key={item.id}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={prod.image_url || "https://via.placeholder.com/100"}
                        alt={prod.name}
                        className="rounded-3 border object-fit-cover"
                        style={{ width: "80px", height: "80px" }}
                      />
                      <div>
                        <h6 className="mb-1 text-dark fw-bold">
                          <Link to={`/products/${prod.id}`} className="text-decoration-none text-dark">
                            {prod.name}
                          </Link>
                        </h6>
                        <span className="badge bg-light text-secondary border me-2">
                          {prod.category?.name || "Product"}
                        </span>
                        <div className="small text-muted mt-1">
                          Price: {formatDualPrice(prod.price)}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-4">
                      {/* Quantity Modifier */}
                      <div className="d-flex align-items-center border rounded-pill p-1 bg-light">
                        <button
                          className="btn btn-sm btn-white text-dark rounded-circle shadow-none px-2 py-0"
                          style={{ width: "28px", height: "28px", lineHeight: "1" }}
                          onClick={() => decreaseQuantity(item)}
                          disabled={loading}
                        >
                          -
                        </button>
                        <span className="px-3 font-weight-bold text-dark small fw-bold">
                          {item.quantity}
                        </span>
                        <button
                          className="btn btn-sm btn-white text-dark rounded-circle shadow-none px-2 py-0"
                          style={{ width: "28px", height: "28px", lineHeight: "1" }}
                          onClick={() => increaseQuantity(item)}
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-end" style={{ minWidth: "110px" }}>
                        <div className="fw-bold text-dark">{formatDualPrice(itemTotal)}</div>
                        <button
                          className="btn btn-link btn-sm text-danger text-decoration-none p-0 mt-1 small"
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-3">
                <Link to="/products" className="text-decoration-none text-primary fw-medium">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="col-lg-4">
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h5 className="fw-bold mb-3 text-dark">Order Summary</h5>
              
              <div className="d-flex justify-content-between py-2 border-bottom text-muted">
                <span>Subtotal ({totalItems} items)</span>
                <span className="fw-bold text-dark">{formatDualPrice(subtotal)}</span>
              </div>
              
              <div className="d-flex justify-content-between py-2 border-bottom text-muted">
                <span>Shipping</span>
                <span className="fw-bold text-dark">
                  {shippingCost === 0 ? <span className="text-success fw-bold">FREE</span> : formatDualPrice(shippingCost)}
                </span>
              </div>

              {shippingCost > 0 && (
                <div className="small text-info mt-2">
                  Add {formatDualPrice(50 - subtotal)} more for <strong>FREE Shipping</strong>!
                </div>
              )}

              <div className="d-flex justify-content-between pt-3 pb-3 mt-2 border-top">
                <strong className="h5 fw-bold mb-0">Total</strong>
                <strong className="h5 fw-bold text-primary mb-0">{formatDualPrice(grandTotal)}</strong>
              </div>

              <button
                className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm"
                onClick={handleCheckoutClick}
                disabled={loading || items.length === 0}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
