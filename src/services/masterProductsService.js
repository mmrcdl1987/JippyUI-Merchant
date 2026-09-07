import { FM_API } from "./api";

// Get all the products (supports server-side pagination with defaults)
export const getAllMasterProducts = async (page = 0, size = 10) => {
  return await FM_API.get(`/api/fm/master-products?page=${page}&size=${size}`);
};

// Get a product by ID
export const getMasterProductById = async (masterProductId) => {
  return await FM_API.get(`/api/fm/master-products/${masterProductId}`);
};

// Update a product by ID
export const updateMasterProduct = async (masterProductId, productData) => {
  return await FM_API.put(
    `/api/fm/master-products/${masterProductId}`,
    productData
  );
};

// Delete a product by ID
export const deleteMasterProduct = async (masterProductId) => {
  return await FM_API.delete(`/api/fm/master-products/${masterProductId}`);
};

// Create a new product
export const createMasterProduct = async (payload) => {
  console.log(JSON.stringify(payload, null, 2));
  return await FM_API.post("/api/fm/master-products", payload);
};

// Filter Master Products (all, veg, non-veg)
export const filterMasterProducts = async (type) => {
  return await FM_API.get(`/api/fm/master-products/filter?type=${type}`);
};

// Search Master Products
export const searchMasterProducts = async (keyword) => {
  return await FM_API.get(
    `/api/fm/master-products/search?keyword=${keyword}`
  );
};

// Compare CSV File
export const compareMasterProductsFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return await FM_API.post(
    "/api/fm/master-products/compare-file",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Bulk Add New Products to Master Products
export const addNewItemsToMasterProducts = async (payload) => {
  return await FM_API.post(
    "/api/fm/master-products/add-new-items",
    payload
  );
};

// Get All Outlets
export const getAllOutlets = async () => {
  return await FM_API.get("/api/fm/outlets");
};

// Add products from master to outlet
export const mapProductsFromMaster = async (payload) => {
  return await FM_API.post("/api/fm/products/from-master", payload);
};

// Backward-compatible alias used by existing screens
export const addProductsToOutlet = mapProductsFromMaster;

// Get Total Outlet Count
export const getOutletCount = async () => {
  return await FM_API.get("/api/fm/outlets/count");
};

// ================= Merchants =================
export const getAllMerchants = async () => {
  return await FM_API.get("/api/fm/merchants");
};

// ================= States =================
export const getAllStates = async () => {
  return await FM_API.get("/api/fm/location/fetchStates");
};

// ================= Cities =================
export const getCitiesByState = async (stateId) => {
  return await FM_API.get(
    `/api/fm/location/fetchCityInState?stateId=${stateId}`
  );
};

// ================= Areas =================
export const getAreasByCity = async (cityId) => {
  return await FM_API.get(
    `/api/fm/location/fetchAreaInCity?cityId=${cityId}`
  );
};

// Create Outlet
export const createOutlet = async (payload) => {
  console.log(JSON.stringify(payload, null, 2));
  return await FM_API.post("/api/fm/outlets/createOutlet", payload);
};

// Update Outlet
export const updateOutlet = async (outletId, payload) => {
  return await FM_API.put(
    `/api/fm/outlets/updateOutletDetailsByMerchant/${outletId}`,
    payload
  );
};

// Get All Categories
export const getAllCategories = async (filter = "ALL") => {
  return await FM_API.get(`/api/fm/getHomeOrAllCategories?filter=${filter}`);
};

// Create New Category
export const createCategory = async (categoryName) => {
  return await FM_API.post("/api/fm/createCategory", { categoryName });
};
