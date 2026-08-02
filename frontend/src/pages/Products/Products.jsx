import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import api from "../../services/api.js";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: "", category_id: "", sort: "newest" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const params = {
      sort: filters.sort,
      page_size: 24,
    };
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;

    setIsLoading(true);
    api
      .get("/products", { params })
      .then((response) => {
        setProducts(response.data.items);
        setError("");
      })
      .catch(() => setError("Unable to load products."))
      .finally(() => setIsLoading(false));
  }, [filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <>
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <h1 className="h3 mb-0">Products</h1>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <input
            className="form-control"
            name="search"
            placeholder="Search products"
            value={filters.search}
            onChange={handleChange}
          />
          <select
            className="form-select"
            name="category_id"
            value={filters.category_id}
            onChange={handleChange}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select className="form-select" name="sort" value={filters.sort} onChange={handleChange}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name</option>
          </select>
        </div>
      </div>
      {isLoading && <p className="text-muted">Loading products...</p>}
      {error && <p className="text-danger">{error}</p>}
      {!isLoading && !error && products.length === 0 && <p className="text-muted">No products found.</p>}
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
