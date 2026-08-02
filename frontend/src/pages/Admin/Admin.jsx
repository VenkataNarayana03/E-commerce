import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api.js";
import { orderService } from "../../services/orderService.js";
import { useAuth } from "../../context/AuthContext.jsx";
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

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out For Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [summary, setSummary] = useState({
    total_users: 0,
    total_products: 0,
    active_categories: 0,
    blocked_users: 0,
    total_orders: 0,
    total_revenue: 0,
  });

  const [formData, setFormData] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [categoryFormData, setCategoryFormData] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadSummary();
    loadOrders();
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
      .catch(() =>
        setSummary({
          total_users: 0,
          total_products: 0,
          active_categories: 0,
          blocked_users: 0,
          total_orders: 0,
          total_revenue: 0,
        })
      );
  };

  const loadOrders = () => {
    orderService
      .adminGetOrders()
      .then((data) => setOrders(data.items || []))
      .catch((error) => {
        const detail = error.response?.data?.detail || "Unable to load customer orders";
        toast.error(detail);
      });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.adminUpdateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
      loadOrders();
      loadSummary();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update order status");
    }
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
    setActiveTab("products");
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
    setActiveTab("categories");
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.shipping_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.user?.email || "").toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Admin Dashboard</h1>
          <p className="text-muted small mb-0">Manage customer orders, catalog, categories, and site metrics.</p>
        </div>
        <div className="text-end small">
          <strong className="d-block text-dark">{user?.full_name}</strong>
          <span className="badge bg-danger">ADMIN</span>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
            <div className="text-muted small fw-semibold">Total Revenue</div>
            <div className="h4 font-weight-bold text-primary mb-0">{formatDualPrice(summary.total_revenue || 0)}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
            <div className="text-muted small fw-semibold">Total Orders</div>
            <div className="h4 font-weight-bold text-dark mb-0">{summary.total_orders || orders.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
            <div className="text-muted small fw-semibold">Total Products</div>
            <div className="h4 font-weight-bold text-dark mb-0">{summary.total_products}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
            <div className="text-muted small fw-semibold">Total Users</div>
            <div className="h4 font-weight-bold text-dark mb-0">{summary.total_users}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills bg-white border rounded-4 p-2 mb-4 gap-2 shadow-sm">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            User Orders ({orders.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Products ({products.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Categories ({categories.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeTab === "orders" && (
        <div className="bg-white border rounded-4 p-4 shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3 mb-md-0">
              <h5 className="fw-bold text-dark mb-0">Customer Orders</h5>
              <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={loadOrders}>
                Refresh
              </button>
            </div>
            
            <div className="d-flex flex-wrap gap-2">
              <input
                type="text"
                className="form-control form-control-sm rounded-pill px-3"
                style={{ minWidth: "220px" }}
                placeholder="Search order #, customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />

              <select
                className="form-select form-select-sm rounded-pill px-3"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-5 text-muted">No orders found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle border-top">
                <thead className="table-light small">
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong className="font-monospace text-dark small">{order.order_number}</strong>
                        <div className="small text-muted">{order.items?.length || 0} item(s)</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark small">{order.shipping_name}</div>
                        <div className="small text-muted">{order.shipping_phone}</div>
                      </td>
                      <td className="small text-muted">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border uppercase">{order.payment_method}</span>
                      </td>
                      <td>
                        <strong className="text-primary">{formatDualPrice(order.total_amount)}</strong>
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm fw-bold border-0 text-white rounded-pill px-3 ${getStatusBadgeClass(order.status)}`}
                          style={{ minWidth: "140px" }}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          {ORDER_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white text-dark fw-normal">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === "products" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <form className="bg-white border rounded-4 p-4 shadow-sm" onSubmit={handleSubmit}>
              <h5 className="fw-bold text-dark mb-3">{editingProductId ? "Edit Product" : "Add New Product"}</h5>
              
              <label className="form-label small fw-semibold" htmlFor="category_id">Category *</label>
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

              <label className="form-label small fw-semibold" htmlFor="name">Product Name *</label>
              <input className="form-control mb-3" id="name" name="name" value={formData.name} onChange={handleChange} required />

              <label className="form-label small fw-semibold" htmlFor="slug">Slug *</label>
              <input className="form-control mb-3" id="slug" name="slug" value={formData.slug} onChange={handleChange} required />

              <label className="form-label small fw-semibold" htmlFor="description">Description</label>
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
                  <label className="form-label small fw-semibold" htmlFor="price">Price ($) *</label>
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
                  <label className="form-label small fw-semibold" htmlFor="stock_quantity">Stock *</label>
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

              <label className="form-label small fw-semibold" htmlFor="image_url">Image URL</label>
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
                <label className="form-check-label small fw-semibold" htmlFor="is_active">Active Product</label>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary rounded-pill px-4 fw-bold" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingProductId ? "Update Product" : "Create Product"}
                </button>
                {editingProductId && (
                  <button className="btn btn-outline-secondary rounded-pill px-3" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="col-lg-7">
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h5 className="fw-bold text-dark mb-3">Product Catalog ({products.length})</h5>
              <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table className="table align-middle">
                  <thead className="table-light small">
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={product.image_url || "https://via.placeholder.com/40"}
                              alt={product.name}
                              className="rounded border object-fit-cover"
                              style={{ width: "40px", height: "40px" }}
                            />
                            <div>
                              <strong className="d-block text-dark small">{product.name}</strong>
                              <span className={`badge ${product.is_active ? "bg-success" : "bg-secondary"}`}>
                                {product.is_active ? "Active" : "Disabled"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="small text-muted">{product.category?.name}</td>
                        <td className="fw-bold text-dark small">{formatDualPrice(product.price)}</td>
                        <td>
                          <span className={`badge ${product.stock_quantity > 0 ? "bg-light text-success border" : "bg-danger"}`}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-outline-secondary btn-sm rounded-pill px-2 me-1" onClick={() => startEdit(product)}>
                            Edit
                          </button>
                          <button className="btn btn-outline-danger btn-sm rounded-pill px-2" onClick={() => handleDelete(product.id)}>
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
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {activeTab === "categories" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h5 className="fw-bold text-dark mb-3">{editingCategoryId ? "Edit Category" : "Add Category"}</h5>
              <form onSubmit={handleCategorySubmit}>
                <label className="form-label small fw-semibold" htmlFor="category-name">Name *</label>
                <input
                  className="form-control mb-3"
                  id="category-name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryChange}
                  required
                />

                <label className="form-label small fw-semibold" htmlFor="category-slug">Slug *</label>
                <input
                  className="form-control mb-3"
                  id="category-slug"
                  name="slug"
                  value={categoryFormData.slug}
                  onChange={handleCategoryChange}
                  required
                />

                <label className="form-label small fw-semibold" htmlFor="category-description">Description</label>
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
                  <label className="form-check-label small fw-semibold" htmlFor="category-is-active">
                    Active Category
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary rounded-pill px-4 fw-bold" type="submit" disabled={isSavingCategory}>
                    {isSavingCategory ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category"}
                  </button>
                  {editingCategoryId && (
                    <button className="btn btn-outline-secondary rounded-pill px-3" type="button" onClick={resetCategoryForm}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="bg-white border rounded-4 p-4 shadow-sm">
              <h5 className="fw-bold text-dark mb-3">Categories ({categories.length})</h5>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-light small">
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td><strong className="text-dark small">{category.name}</strong></td>
                        <td className="font-monospace text-muted small">{category.slug}</td>
                        <td>
                          <span className={`badge ${category.is_active ? "bg-success" : "bg-secondary"}`}>
                            {category.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-outline-secondary btn-sm me-1 rounded-pill px-2" onClick={() => startEditCategory(category)}>
                            Edit
                          </button>
                          <button className="btn btn-outline-danger btn-sm rounded-pill px-2" onClick={() => handleCategoryDelete(category.id)}>
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
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  Order Details: <span className="font-monospace text-primary">{selectedOrder.order_number}</span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedOrder(null)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <span className="small text-muted d-block">Customer Name:</span>
                    <strong className="text-dark">{selectedOrder.shipping_name}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="small text-muted d-block">Phone:</span>
                    <strong className="text-dark">{selectedOrder.shipping_phone}</strong>
                  </div>
                  <div className="col-12">
                    <span className="small text-muted d-block">Shipping Address:</span>
                    <span className="text-dark">
                      {selectedOrder.shipping_address_line1}, {selectedOrder.shipping_address_line2 ? `${selectedOrder.shipping_address_line2}, ` : ""}
                      {selectedOrder.shipping_city}, {selectedOrder.shipping_state} - {selectedOrder.shipping_postal_code}, {selectedOrder.shipping_country}
                    </span>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-2">Purchased Items:</h6>
                <div className="table-responsive border rounded-3 mb-3">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light small">
                      <tr>
                        <th>Item</th>
                        <th className="text-center">Price</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-semibold small">{item.product_name}</td>
                          <td className="text-center small text-muted">{formatDualPrice(item.unit_price)}</td>
                          <td className="text-center fw-bold small">{item.quantity}</td>
                          <td className="text-end fw-bold small">{formatDualPrice(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between pt-2 border-top">
                  <span className="fw-bold text-dark">Total Amount Paid:</span>
                  <span className="h5 fw-bold text-primary mb-0">{formatDualPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
