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
export const updateOutlet = async (outletId, payload) => {
  try {
    console.log("Update Outlet Payload:", payload);

    const response = await api.put(
      `/api/fm/outlets/updateOutletDetailsByMerchant/${outletId}`,
      payload
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
    const response = await api.get(
      "/api/fm/location/fetchStates"
    );

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

/**
 * Get All Outlets
 */
export const getAllOutlets = async () => {
  try {
    const response = await api.get(
      "/api/fm/outlets"
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching outlets:", error);
    throw error;
  }
};

/**
 * Get outlet foods
 */
export const getOutletFoods = async (outletId) => {
  try {
    const response = await api.get(
      "/api/fm/outlets/getOutletDetails",
      {
        params: {
          outletId,
          userType: "MERCHANT",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching outlet foods:", error);
    throw error;
  }
};

/**
 * Edit and update outlet products
 */
export const editAndUpdateOutletProducts = async (
  outletId,
  payload
) => {
  try {
    const response = await api.put(
      `/api/fm/outlets/updateOutletDetailsByMerchant/${outletId}`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error updating outlet products:",
      error
    );
    throw error;
  }
};

/* =========================================================
   ADMIN - GET COMPLETE OUTLET DETAILS
   ========================================================= */

/**
 * Get complete outlet details including
 * categories and products.
 */
export const getAdminOutletDetails = async (outletId) => {
  try {
    if (!outletId) {
      throw new Error("Outlet ID is required");
    }

    const response = await api.get(
      "/api/fm/outlets/admin/outlet-details",
      {
        params: {
          outletId,
        },
      }
    );

    console.log(
      "Complete Admin Outlet Details Response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching complete admin outlet details:",
      error
    );

    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Response:",
      error.response?.data
    );

    throw error;
  }
};

/* =========================================================
   MERCHANT PRICE UPDATE
   ========================================================= */

/**
 * Update merchant price
 *
 * API:
 * PUT /api/fm/products/{productId}/merchant-price
 *
 * Request body:
 * {
 *   merchantPrice: 55,
 *   role: "ROLE_MERCHANT",
 *   updatedBy: 77
 * }
 *
 * The logged-in user's role and userId are taken
 * from localStorage. The userId is sent as updatedBy.
 */
export const updateMerchantPrice = async (
  productId,
  merchantPrice
) => {
  try {
    /* ---------------------------------------------
       Validate Product ID
    --------------------------------------------- */

    if (
      productId === null ||
      productId === undefined ||
      productId === ""
    ) {
      throw new Error("Product ID is required.");
    }

    /* ---------------------------------------------
       Validate Merchant Price
    --------------------------------------------- */

    if (
      merchantPrice === null ||
      merchantPrice === undefined ||
      merchantPrice === ""
    ) {
      throw new Error("Merchant price is required.");
    }

    const numericPrice = Number(merchantPrice);

    if (!Number.isFinite(numericPrice)) {
      throw new Error(
        "Merchant price must be a valid number."
      );
    }

    if (numericPrice < 0) {
      throw new Error(
        "Merchant price cannot be negative."
      );
    }

    /* ---------------------------------------------
       Get logged-in user
    --------------------------------------------- */

    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      throw new Error(
        "User information not found in local storage. Please login again."
      );
    }

    let user;

    try {
      user = JSON.parse(storedUser);
    } catch (parseError) {
      console.error(
        "Unable to parse stored user:",
        parseError
      );

      throw new Error(
        "Invalid user information in local storage."
      );
    }

    /* ---------------------------------------------
       Get User ID
    --------------------------------------------- */

    const userId = user?.userId;

    if (
      userId === null ||
      userId === undefined
    ) {
      throw new Error(
        "User ID not found. Please login again."
      );
    }

    /* ---------------------------------------------
       Get User Role
    --------------------------------------------- */

    let role = null;

    if (
      Array.isArray(user?.roles) &&
      user.roles.length > 0
    ) {
      role = user.roles[0];
    } else if (user?.userType) {
      role =
        `ROLE_${String(
          user.userType
        ).toUpperCase()}`;
    }

    if (!role) {
      throw new Error(
        "User role not found."
      );
    }

    role = String(role)
      .trim()
      .toUpperCase();

    /* ---------------------------------------------
       Supported Roles
    --------------------------------------------- */

    const supportedRoles = [
      "ROLE_MERCHANT",
      "ROLE_SUPERADMIN",
      "ROLE_DEVADMIN",
    ];

    if (!supportedRoles.includes(role)) {
      throw new Error(
        `Unsupported user role: ${role}`
      );
    }

    /* ---------------------------------------------
       Request Body
    --------------------------------------------- */

    const requestBody = {
      merchantPrice: numericPrice,
      role: role,
      updatedBy: Number(userId),
    };

    console.log(
      "[MERCHANT-PRICE] Updating merchant price:",
      {
        productId,
        merchantPrice: numericPrice,
        role,
        updatedBy: Number(userId),
      }
    );

    /* ---------------------------------------------
       CALL API
    --------------------------------------------- */

    const response = await api.put(
      `/api/fm/products/${productId}/merchant-price`,
      requestBody
    );

    console.log(
      "[MERCHANT-PRICE] Update response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "[MERCHANT-PRICE] Error updating merchant price:",
      error
    );

    console.error(
      "[MERCHANT-PRICE] Status:",
      error.response?.status
    );

    console.error(
      "[MERCHANT-PRICE] Response:",
      error.response?.data
    );

    throw error;
  }
};