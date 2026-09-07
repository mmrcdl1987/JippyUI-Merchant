import { FM_API } from "./api";

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
