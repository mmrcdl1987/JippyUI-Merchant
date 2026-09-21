import { FM_API } from "./api";

// ============================================================
// 1. Get Complete Product Details by Product ID
// GET /api/fm/products/getCompleteProductDetails/{productId}
// ============================================================
export const getCompleteProductDetails = async (productId) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    console.log(
      "[PRODUCT-DETAIL] Calling getCompleteProductDetails API:",
      `/api/fm/products/getCompleteProductDetails/${productId}`
    );

    const response = await FM_API.get(
      `/api/fm/products/getCompleteProductDetails/${productId}`
    );

    console.log("[PRODUCT-DETAIL] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.warn(
      "[PRODUCT-DETAIL] getCompleteProductDetails failed, trying fallback /productdetails:",
      error?.response?.data || error
    );
    try {
      const fallbackRes = await FM_API.get(
        `/api/fm/products/productdetails/${productId}`
      );
      return fallbackRes.data;
    } catch (fallbackErr) {
      console.error("[PRODUCT-DETAIL] Fetch Error:", fallbackErr);
      throw error;
    }
  }
};

// Backward-compatible alias
export const getProductDetailById = getCompleteProductDetails;

// ============================================================
// 2. Update Complete Outlet Product Details
// PUT /api/fm/products/updateCategoryAndProductDetails/{productId}
// ============================================================
export const updateCategoryAndProductDetails = async (productId, payload) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    console.log(
      "[PRODUCT-DETAIL] Calling updateCategoryAndProductDetails API:",
      `/api/fm/products/updateCategoryAndProductDetails/${productId}`,
      payload
    );

    const response = await FM_API.put(
      `/api/fm/products/updateCategoryAndProductDetails/${productId}`,
      payload
    );

    console.log(
      "[PRODUCT-DETAIL] updateCategoryAndProductDetails Response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "[PRODUCT-DETAIL] updateCategoryAndProductDetails Error:",
      error?.response?.data || error
    );
    throw error;
  }
};

// Backward-compatible alias
export const updateProductDetails = updateCategoryAndProductDetails;

// ============================================================
// 3. Display Outlet Products
// GET /api/fm/products/outlet/{outletId}
// ============================================================
export const getOutletProducts = async (outletId) => {
  try {
    if (!outletId) {
      throw new Error("Outlet ID is required.");
    }

    console.log(
      "[OUTLET-PRODUCTS] Fetching products for outlet:",
      `/api/fm/products/outlet/${outletId}`
    );

    const response = await FM_API.get(`/api/fm/products/outlet/${outletId}`);
    console.log("[OUTLET-PRODUCTS] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "[OUTLET-PRODUCTS] Error fetching outlet products:",
      error?.response?.data || error
    );
    throw error;
  }
};

// ============================================================
// 4. Update Merchant Price (Uses Update Product Details API)
// ============================================================
export const updateMerchantPrice = async (productId, payloadOrPrice) => {
  try {
    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const numericPrice =
      typeof payloadOrPrice === "number"
        ? payloadOrPrice
        : typeof payloadOrPrice === "object" && payloadOrPrice?.merchantPrice !== undefined
        ? Number(payloadOrPrice.merchantPrice)
        : Number(payloadOrPrice);

    console.log(
      `[PRODUCT-PRICE] Updating merchant price for product ${productId} to ₹${numericPrice}`
    );

    // Fetch existing product details to perform a full update
    try {
      const currentDetail = await getCompleteProductDetails(productId);
      const detailData =
        currentDetail?.data?.data ||
        currentDetail?.data ||
        currentDetail ||
        {};

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

      const response = await updateCategoryAndProductDetails(
        productId,
        updatePayload
      );
      return response;
    } catch (fullUpdateErr) {
      console.warn(
        "[PRODUCT-PRICE] Full update failed, attempting /updateproduct fallback:",
        fullUpdateErr
      );

      try {
        const response = await FM_API.put(
          `/api/fm/products/updateproduct/${productId}`,
          {
            merchantPrice: numericPrice,
          }
        );
        return response.data;
      } catch (fbErr) {
        throw fullUpdateErr;
      }
    }
  } catch (error) {
    console.error(
      "[PRODUCT-PRICE] Error updating merchant price:",
      error?.response?.data || error
    );
    throw error;
  }
};
