import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import BackButton from "../../components/BackButton/BackButton.jsx";
import { formatDualPrice } from "../../utils/price.js";

const emptyForm = {
  category_id: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  stock_quantity: 0,
  image_url: "",
  is_active: true,
};

const emptyCategoryForm = {
  name: "",
  slug: "",
  description: "",
  is_active: true,
};

function Admin() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ total_users: 0, total_products: 0, active_categories: 0, blocked_users: 0 });
  const [formData, setFormData] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((response) => setMessage(response.data.message))
      .catch(() => setMessage("Unable to load admin dashboard details."));
    loadCategories();
    loadProducts();
    loadSummary();
  }, []);

  const loadCategories = () => {
    api
      .get("/categories")
      .then((response) => setCategories(response.data))
      .catch(() => toast.error("Unable to load categories"));
  };

  const loadProducts = () => {
    api
      .get("/products", { params: { page_size: 100 } })
      .then((response) => setProducts(response.data.items))
      .catch(() => toast.error("Unable to load products"));
  };

  const loadSummary = () => {
    api
      .get("/admin/summary")
      .then((response) => setSummary(response.data))
      .catch(() => setSummary({ total_users: 0, total_products: 0, active_categories: 0, blocked_users: 0 }));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const startEdit = (product) => {
    setEditingProductId(product.id);
    setFormData({
      category_id: product.category_id,
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || "",
      is_active: product.is_active,
    });
  };

  const resetForm = () => {
    setEditingProductId(null);
    setFormData(emptyForm);
  };

  const handleCategoryChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCategoryFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const startEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      is_active: category.is_active,
    });
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryFormData(emptyCategoryForm);
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setIsSavingCategory(true);

    try {
      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, categoryFormData);
        toast.success("Category updated");
      } else {
        await api.post("/categories", categoryFormData);
        toast.success("Category created");
      }
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to save category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success("Category deleted");
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to delete category");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
      price: Number(formData.price),
      stock_quantity: Number(formData.stock_quantity),
      image_url: formData.image_url || null,
      description: formData.description || null,
    };

    try {
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted");
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to delete product");
    }
  };

  return (
    <>
      <BackButton />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Admin</h1>
      </div>
      <div className="bg-white border rounded p-4 mb-4">
        <p className="mb-1">
          <strong>Name:</strong> {user?.full_name}
        </p>
        <p className="mb-1">
          <strong>Email:</strong> {user?.email}
        </p>
        <p className="mb-0 text-muted">{message}</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="bg-white border rounded p-3 h-100">
            <div className="text-muted small">Total Users</div>
            <div className="h3 mb-0">{summary.total_users}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-3 h-100">
            <div className="text-muted small">Total Products</div>
            <div className="h3 mb-0">{summary.total_products}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-3 h-100">
            <div className="text-muted small">Active Categories</div>
            <div className="h3 mb-0">{summary.active_categories}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="bg-white border rounded p-3 h-100">
            <div className="text-muted small">Blocked Users</div>
            <div className="h3 mb-0">{summary.blocked_users}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="bg-white border rounded p-4 mb-4">
            <h2 className="h5 mb-3">{editingCategoryId ? "Edit Category" : "Add Category"}</h2>
            <form onSubmit={handleCategorySubmit}>
              <label className="form-label" htmlFor="category-name">Name</label>
              <input
                className="form-control mb-3"
                id="category-name"
                name="name"
                value={categoryFormData.name}
                onChange={handleCategoryChange}
                required
              />

              <label className="form-label" htmlFor="category-slug">Slug</label>
              <input
                className="form-control mb-3"
                id="category-slug"
                name="slug"
                value={categoryFormData.slug}
                onChange={handleCategoryChange}
                required
              />

              <label className="form-label" htmlFor="category-description">Description</label>
              <textarea
                className="form-control mb-3"
                id="category-description"
                name="description"
                rows="2"
                value={categoryFormData.description}
                onChange={handleCategoryChange}
              />

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  id="category-is-active"
                  name="is_active"
                  type="checkbox"
                  checked={categoryFormData.is_active}
                  onChange={handleCategoryChange}
                />
                <label className="form-check-label" htmlFor="category-is-active">
                  Active
                </label>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary" type="submit" disabled={isSavingCategory}>
                  {isSavingCategory ? "Saving..." : editingCategoryId ? "Update" : "Create"}
                </button>
                {editingCategoryId && (
                  <button className="btn btn-outline-secondary" type="button" onClick={resetCategoryForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <form className="bg-white border rounded p-4" onSubmit={handleSubmit}>
            <h2 className="h5 mb-3">{editingProductId ? "Edit Product" : "Add Product"}</h2>
            <label className="form-label" htmlFor="category_id">Category</label>
            <select
              className="form-select mb-3"
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <label className="form-label" htmlFor="name">Name</label>
            <input className="form-control mb-3" id="name" name="name" value={formData.name} onChange={handleChange} required />

            <label className="form-label" htmlFor="slug">Slug</label>
            <input className="form-control mb-3" id="slug" name="slug" value={formData.slug} onChange={handleChange} required />

            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              className="form-control mb-3"
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />

            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="price">Price</label>
                <input
                  className="form-control mb-3"
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="stock_quantity">Stock</label>
                <input
                  className="form-control mb-3"
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label className="form-label" htmlFor="image_url">Image URL</label>
            <input className="form-control mb-3" id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} />

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="is_active">Active</label>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingProductId ? "Update" : "Create"}
              </button>
              {editingProductId && (
                <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="col-lg-7">
          <div className="bg-white border rounded p-4 mb-4">
            <h2 className="h5 mb-3">Categories</h2>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.slug}</td>
                      <td>{category.is_active ? "Active" : "Inactive"}</td>
                      <td className="text-end">
                        <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => startEditCategory(category)}>
                          Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleCategoryDelete(category.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded p-4 mb-4">
            <h2 className="h5 mb-3">Products</h2>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category?.name}</td>
                      <td>{formatDualPrice(product.price)}</td>
                      <td>{product.stock_quantity}</td>
                      <td className="text-end">
                        <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => startEdit(product)}>
                          Edit
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(product.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Admin;
