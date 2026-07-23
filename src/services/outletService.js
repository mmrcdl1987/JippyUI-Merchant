import api from "./api";

/**
 * Get all outlets for the logged-in merchant
 */
export const getOutletsByMerchant = async () => {
  try {
    const merchantId = localStorage.getItem("merchantId");

    if (!merchantId) {
      throw new Error("Merchant ID not found. Please login again.");
    }

    const response = await api.get(
      "/api/fm/outlets/getOutletsByMerchant",
      {
        params: {
          merchantId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching merchant outlets:", error);
    throw error;
  }
};

/**
 * Get outlet details by outlet id
 */
export const getOutletById = async (outletId) => {
  try {
    const response = await api.get(
      "/api/fm/outlets/getOutletDetails",
      {
        params: {
          outletId,
          userType: "MERCHANT",
          // customerId: null // Optional
        },
      }
    );

    console.log("Outlet Details Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching outlet details:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    throw error;
  }
};

/**
 * Create new outlet
 */
export const createOutlet = async (payload) => {
  try {
    console.log("Create Outlet Payload:", payload);

    const response = await api.post(
      "/api/fm/outlets/createOutlet",
      payload
    );

    console.log("Create Outlet Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Create Outlet Error:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    throw error;
  }
};

/**
 * Update outlet details, timings, categories and products
 */
export const updateOutlet = async (payload) => {
  try {
    console.log("Update Outlet Payload:", payload);

    const response = await api.put(
      "/api/fm/outlets/editAndUpdateOutletProducts",
      payload,
      {
        params: {
          outletId: payload.outletId,
          userType: "MERCHANT",
        },
      }
    );

    console.log("Update Outlet Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error updating outlet:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    throw error;
  }
};

/**
 * Delete outlet
 */
export const deleteOutlet = async (outletId) => {
  try {
    const response = await api.delete(
      `/api/fm/outlets/${outletId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting outlet:", error);
    throw error;
  }
};

/**
 * Approve outlet
 */
export const approveOutlet = async (outletId) => {
  try {
    const response = await api.put(
      `/api/fm/outlets/${outletId}/approve`
    );

    return response.data;
  } catch (error) {
    console.error("Error approving outlet:", error);
    throw error;
  }
};

/**
 * Reject outlet
 */
export const rejectOutlet = async (outletId) => {
  try {
    const response = await api.put(
      `/api/fm/outlets/${outletId}/reject`
    );

    return response.data;
  } catch (error) {
    console.error("Error rejecting outlet:", error);
    throw error;
  }
};

/**
 * Get all states
 */
export const getStates = async () => {
  try {
    const response = await api.get("/api/fm/location/fetchStates");
    return response.data;
  } catch (error) {
    console.error("Error fetching states:", error);
    throw error;
  }
};

/**
 * Get cities by state
 */
export const getCities = async (stateId) => {
  try {
    const response = await api.get(
      "/api/fm/location/fetchCityInState",
      {
        params: {
          stateId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};

/**
 * Get areas by city
 */
export const getAreas = async (cityId) => {
  try {
    const response = await api.get(
      "/api/fm/location/fetchAreaInCity",
      {
        params: {
          cityId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching areas:", error);
    throw error;
  }
};