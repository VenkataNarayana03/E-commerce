import BackButton from "../../components/BackButton/BackButton.jsx";

function Checkout() {
  return (
    <>
      <BackButton />
      <h1 className="h3">Checkout</h1>
      <p className="text-muted">Checkout flow will connect to the backend order API.</p>
    </>
  );
}

export default Checkout;

