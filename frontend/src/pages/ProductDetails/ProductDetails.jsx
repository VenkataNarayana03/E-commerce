import { useParams } from "react-router-dom";

function ProductDetails() {
  const { id } = useParams();

  return (
    <>
      <h1 className="h3">Product Details</h1>
      <p className="text-muted">Product ID: {id}</p>
    </>
  );
}

export default ProductDetails;

