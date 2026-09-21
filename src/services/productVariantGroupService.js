import { FM_API } from "./api";

// ============================================================
// 1. FM Product Variant Group Controller
// ============================================================

// Get all variant groups
export const getAllVariantGroups = async () => {
  return await FM_API.get(`/api/fm/product-variant-groups`);
};

// Create a new variant group
export const saveVariantGroup = async (payload) => {
  return await FM_API.post(`/api/fm/product-variant-groups`, payload);
};

// Get a variant group by ID
export const getVariantGroupById = async (groupId) => {
  return await FM_API.get(`/api/fm/product-variant-groups/${groupId}`);
};

// Delete a variant group by ID
export const deleteVariantGroup = async (groupId) => {
  return await FM_API.delete(`/api/fm/product-variant-groups/${groupId}`);
};

// ============================================================
// 2. FM Product Variant Group Value Controller
// ============================================================

// Get values for a specific variant group
export const getVariantGroupValues = async (groupId) => {
  return await FM_API.get(`/api/fm/product-variant-groups/${groupId}/values`);
};

// Create a new value for a specific variant group
export const saveVariantGroupValue = async (groupId, payload) => {
  return await FM_API.post(`/api/fm/product-variant-groups/${groupId}/values`, payload);
};

// Get a specific value by ID for a variant group
export const getVariantGroupValueById = async (groupId, valueId) => {
  return await FM_API.get(`/api/fm/product-variant-groups/${groupId}/values/${valueId}`);
};

// Delete a specific value by ID for a variant group
export const deleteVariantGroupValue = async (groupId, valueId) => {
  return await FM_API.delete(`/api/fm/product-variant-groups/${groupId}/values/${valueId}`);
};

// ============================================================
// 3. FM Product Variant Option Controller
// ============================================================

// Get variant options for a specific product
export const getProductVariantOptions = async (productId) => {
  return await FM_API.get(`/api/fm/products/${productId}/variant-options`);
};

// Save a variant option for a specific product
export const saveProductVariantOption = async (productId, payload) => {
  return await FM_API.post(`/api/fm/products/${productId}/variant-options`, payload);
};

// Get a specific variant option by ID for a product
export const getProductVariantOptionById = async (productId, optionId) => {
  return await FM_API.get(`/api/fm/products/${productId}/variant-options/${optionId}`);
};

// Delete a variant option by ID for a product
export const deleteProductVariantOption = async (productId, optionId) => {
  return await FM_API.delete(`/api/fm/products/${productId}/variant-options/${optionId}`);
};
