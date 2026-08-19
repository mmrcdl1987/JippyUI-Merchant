import api from "./api";

/**
 * Create Merchant
 */
export const createMerchant = async (merchantData) => {
  try {
    console.log("POST /api/fm/merchants/createMerchant");
    console.log(merchantData);

    const response = await api.post(
      "/api/fm/merchants/createMerchant",
      merchantData
    );

    return response.data;
  } catch (error) {
    console.error("Error creating merchant:", error);
    throw error;
  }
};

/**
 * Get Logged-in Merchant Profile
 */
export const getMerchantProfile = async () => {
  try {
    const merchantId = localStorage.getItem("merchantId");

    console.log("Merchant ID:", merchantId);

    if (!merchantId) {
      throw new Error("Merchant ID not found. Please login again.");
    }

    const response = await api.get(
      `/api/fm/merchants/getMerchantProfile?merchantId=${merchantId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching merchant profile:", error);
    throw error;
  }
};