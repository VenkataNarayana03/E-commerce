import ProductCard from "../../components/ProductCard/ProductCard.jsx";

const products = [
  {
    id: 1,
    name: "Classic Shirt",
    description: "Soft cotton shirt for everyday wear.",
    price: 29.99,
  },
  {
    id: 2,
    name: "Running Shoes",
    description: "Lightweight shoes with a cushioned sole.",
    price: 74.99,
  },
  {
    id: 3,
    name: "Canvas Backpack",
    description: "Durable backpack with laptop storage.",
    price: 49.99,
  },
];

function Products() {
  return (
    <>
      <h1 className="h3 mb-4">Products</h1>
      <div className="row g-4">
        {products.map((product) => (
          <div className="col-sm-6 col-lg-4" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </>
  );
}

export default Products;

