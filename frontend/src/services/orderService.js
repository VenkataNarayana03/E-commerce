import api from "./api.js";

export const orderService = {
  async createOrder(orderData) {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  async getOrders() {
    const response = await api.get("/orders");
    return response.data;
  },

  async getOrder(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Admin APIs
  async adminGetOrders() {
    const response = await api.get("/admin/orders");
    return response.data;
  },

  async adminUpdateOrderStatus(orderId, newStatus) {
    const response = await api.put(`/admin/orders/${orderId}/status`, {
      status: newStatus,
    });
    return response.data;
  },
};
