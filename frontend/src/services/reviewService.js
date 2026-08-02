import api from "./api.js";

export const reviewService = {
  async getReviews(productId) {
    const response = await api.get(`/products/${productId}/reviews`);
    return response.data;
  },

  async getRatingSummary(productId) {
    const response = await api.get(`/products/${productId}/rating-summary`);
    return response.data;
  },

  async submitReview(productId, reviewData) {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
  },
};
