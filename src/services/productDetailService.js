import { FM_API } from "./api";

// ============================================================
// Get Product Details by Product ID
// GET /api/fm/products/productdetails/{productId}
// ============================================================
export const getProductDetailById = async (productId) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    console.log(
      "[PRODUCT-DETAIL] Calling API:",
      `/api/fm/products/productdetails/${productId}`
    );

    const response = await FM_API.get(
      `/api/fm/products/productdetails/${productId}`
    );

    console.log("[PRODUCT-DETAIL] API Response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "[PRODUCT-DETAIL] Fetch Error:",
      error?.response?.data || error
    );

    throw error;
  }
};

// ============================================================
// Update Product Details / Merchant Edit Product
// PUT /api/fm/products/updateproduct/{productId}
// ============================================================
export const updateProductDetails = async (productId, payload) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    console.log(
      "[PRODUCT-DETAIL] Calling Update API:",
      `/api/fm/products/updateproduct/${productId}`,
      payload
    );

    const response = await FM_API.put(
      `/api/fm/products/updateproduct/${productId}`,
      payload
    );

    console.log("[PRODUCT-DETAIL] Update API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[PRODUCT-DETAIL] Update Error:",
      error?.response?.data || error
    );
    throw error;
  }
};
