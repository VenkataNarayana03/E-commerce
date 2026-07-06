import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";
import { formatDualPrice } from "../../utils/price.js";

function Cart() {
  const { items, removeFromCart, clearCart } = useCart();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <BackButton />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Cart</h1>
        {items.length > 0 && (
          <button className="btn btn-outline-secondary btn-sm" onClick={clearCart}>
            Clear
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted">Your cart is empty.</p>
      ) : (
        <div className="bg-white border rounded p-3">
          {items.map((item) => (
            <div className="d-flex justify-content-between border-bottom py-2" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <div className="small text-muted">Qty: {item.quantity}</div>
              </div>
              <div className="text-end">
                <div>{formatDualPrice(item.price * item.quantity)}</div>
                <button className="btn btn-link btn-sm p-0" onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="d-flex justify-content-between pt-3">
            <strong>Total</strong>
            <strong>{formatDualPrice(total)}</strong>
          </div>
          <Link className="btn btn-primary w-100 mt-3" to="/checkout">
            Checkout
          </Link>
        </div>
      )}
    </>
  );
}

export default Cart;

