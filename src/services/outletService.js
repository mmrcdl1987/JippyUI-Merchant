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
 * Get the persisted active/toggle status for one outlet.
 */
export const getOutletStatusById = async (outletId) => {
  if (!outletId) {
    throw new Error("Outlet ID is required.");
  }

  try {
    const response = await api.get(
      `/api/fm/outlets/getOutletById/${outletId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching outlet status:", error);
    throw error;
  }
};

/**
 * Get available cuisine types for outlet creation.
 */
export const getCuisineTypes = async () => {
  try {
    const response = await api.get("/api/fm/cuisine-types");
    return response.data;
  } catch (error) {
    console.error("Error fetching cuisine types:", error);
    throw error;
  }
};

/**
 * Create outlet/category unavailability.
 */
export const createOutletUnavailability = async (payload) => {
  try {
    const response = await api.post(
      "/api/fm/outlet-unavailability",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating outlet unavailability:", error);
    throw error;
  }
};

/**
 * Restore outlet/category availability.
 */
export const restoreOutletAvailability = async (payload) => {
  try {
    const response = await api.patch(
      "/api/fm/outlet-unavailability/restore",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error restoring outlet availability:", error);
    throw error;
  }
};

/**
 * Get the current availability of an outlet category.
 */
export const getOutletCategoryAvailability = async (outletCategoryId) => {
  if (!outletCategoryId) {
    throw new Error("Outlet category ID is required.");
  }

  try {
    const response = await api.get(
      `/api/fm/outlet-unavailability/outlet-category/${outletCategoryId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching outlet category availability:", error);
    throw error;
  }
};

/**
 * Enable or disable an outlet for outlet operations.
 */
export const toggleOutlet = async (outletId, isToggle) => {
  if (!outletId) {
    throw new Error("Outlet ID is required.");
  }

  try {
    const response = await api.put(
      "/api/fm/outlets/toggleForOutlet",
      {
        outletId: Number(outletId),
        isToggle: Boolean(isToggle),
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error toggling outlet status:", error);
    throw error;
  }
};

/**
 * Upload or replace an outlet image.
 */
export const uploadOutletImage = async (outletId, imageFile) => {
  if (!outletId) {
    throw new Error("Outlet ID is required.");
  }

  if (!(imageFile instanceof File)) {
    throw new Error("A valid image file is required.");
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await api.post(
      `/api/fm/outlets/${outletId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading outlet image:", error);
    throw error;
  }
};

/**
 * Upload an outlet image using the merchant upload endpoint.
 */
export const uploadOutletImageByMerchant = async (merchantId, imageFile) => {
  if (!merchantId) {
    throw new Error("Merchant ID is required.");
  }

  if (!(imageFile instanceof File)) {
    throw new Error("A valid image file is required.");
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await api.post(
      "/api/fm/outlets/upload-image",
      formData,
      {
        params: { merchantId },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading merchant outlet image:", error);
    throw error;
  }
};

/**
 * Update an outlet image URL directly.
 */
export const updateOutletProfilePic = async (outletId, outletPicUrl) => {
  if (!outletId) {
    throw new Error("Outlet ID is required.");
  }

  if (!outletPicUrl) {
    throw new Error("Outlet image URL is required.");
  }

  try {
    const response = await api.put(
      "/api/fm/outlets/updateOutletProfilePic",
      { outletId: Number(outletId), outletPicUrl }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating outlet image URL:", error);
    throw error;
  }
};

/**
 * Get the current outlet image URL.
 */
export const getOutletImage = async (outletId) => {
  if (!outletId) {
    throw new Error("Outlet ID is required.");
  }

  try {
    const response = await api.get(
      `/api/fm/outlets/getOutletById/${outletId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching outlet image:", error);
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
       1. Update Price via Product Update API
    --------------------------------------------- */
    try {
      let detailData = {};
      try {
        const detailRes = await api.get(
          `/api/fm/products/getCompleteProductDetails/${productId}`
        );
        detailData =
          detailRes?.data?.data ||
          detailRes?.data ||
          detailRes ||
          {};
      } catch (getErr) {
        console.warn("[MERCHANT-PRICE] getCompleteProductDetails failed, trying /productdetails:", getErr);
        try {
          const fbRes = await api.get(`/api/fm/products/productdetails/${productId}`);
          detailData = fbRes?.data?.data || fbRes?.data || fbRes || {};
        } catch (_) {}
      }

      const updatePayload = {
        productName: detailData.productName || "Product",
        outletCategoryId: Number(
          detailData.outletCategoryId || detailData.categoryId || 1
        ),
        description: detailData.description || "",
        isVeg:
          detailData.isVeg !== undefined ? Boolean(detailData.isVeg) : true,
        hasProductVariants: Boolean(
          detailData.hasProductVariants ||
            (detailData.variantGroups && detailData.variantGroups.length > 0)
        ),
        merchantPrice: numericPrice,
        imageLink: detailData.imageLink || "",
        photos: detailData.photos || "",
        thumbnail: detailData.thumbnail || "",
        productType: detailData.productType || "FOOD",
        timings: detailData.timings || detailData.productTimings || [],
        variantGroups:
          detailData.variantGroups || detailData.productVariantGroups || [],
      };

      const updateResponse = await api.put(
        `/api/fm/products/updateCategoryAndProductDetails/${productId}`,
        updatePayload
      );

      console.log(
        "[MERCHANT-PRICE] Price updated successfully via updateCategoryAndProductDetails:",
        updateResponse.data
      );

      return updateResponse.data;
    } catch (fullUpdateErr) {
      console.warn(
        "[MERCHANT-PRICE] updateCategoryAndProductDetails failed, trying updateproduct API:",
        fullUpdateErr
      );

      try {
        const response = await api.put(
          `/api/fm/products/updateproduct/${productId}`,
          {
            merchantPrice: numericPrice,
          }
        );
        return response.data;
      } catch (fbErr) {
        console.error("[MERCHANT-PRICE] updateproduct fallback error:", fbErr);
        throw fullUpdateErr;
      }
    }
  } catch (error) {
    console.error(
      "[MERCHANT-PRICE] Error updating merchant price:",
      error
    );

    throw error;
  }
};

/* =========================================================
   OUTLET CATEGORIES – Link a category to an outlet
   POST /api/fm/api/outlet-categories
   ========================================================= */

/**
 * Link an existing category to an outlet.
 *
 * Idempotent: returns 200 with the existing record if already linked,
 * or 201 on new creation.
 *
 * @param {number|string} outletId   - The outlet ID.
 * @param {number|string} categoryId - The category ID to link.
 * @returns {Promise} Axios response
 */
export const addCategoryToOutlet = async (outletId, categoryId) => {
  try {
    if (!outletId) throw new Error("Outlet ID is required.");
    if (!categoryId) throw new Error("Category ID is required.");

    const payload = {
      outletId: Number(outletId),
      categoryId: Number(categoryId),
    };

    console.log("[OUTLET-CATEGORIES] Payload:", payload);

    const response = await api.post(
      "/api/fm/api/outlet-categories",
      payload
    );

    console.log("[OUTLET-CATEGORIES] Response:", response.data);

    return response.data;
  } catch (error) {
    console.error("[OUTLET-CATEGORIES] Error:", error);
    console.error("[OUTLET-CATEGORIES] Status:", error.response?.status);
    console.error("[OUTLET-CATEGORIES] Response:", error.response?.data);
    throw error;
  }
};