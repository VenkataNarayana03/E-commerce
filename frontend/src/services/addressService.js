import api from "./api.js";

export const addressService = {
  async getAddresses() {
    const response = await api.get("/addresses");
    return response.data;
  },

  async createAddress(addressData) {
    const response = await api.post("/addresses", addressData);
    return response.data;
  },

  async setDefaultAddress(addressId) {
    const response = await api.put(`/addresses/${addressId}/default`);
    return response.data;
  },

  async deleteAddress(addressId) {
    const response = await api.delete(`/addresses/${addressId}`);
    return response.data;
  },
};
