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
      `http://srv1617582.hstgr.cloud:8084/api/fm/merchants/getMerchantProfile?merchantId=${merchantId}`
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching merchant profile:", error);
    throw error;
  }
};



// updateMerchantProfile
export const updateMerchantProfile = async (payload) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    "http://srv1617582.hstgr.cloud:8084/api/fm/merchants/updateMerchantProfile",
    {
      method: "PUT",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update merchant profile");
  }

  return response.json();
};

/**
 
 * @param {string|number} entityId - merchant.merchantId for this dashboard
 * @param {string} entityType - e.g. "MERCHANT" (TODO: confirm)
 * @param {{aadharFile?: File, fssaiFile?: File, panFile?: File, gstFile?: File, rcCopyFile?: File, drivingLicenseFile?: File}} files
 */
export const uploadMerchantDocuments = async (entityId, entityType, files) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("entityId", entityId);
  formData.append("entityType", entityType);
  Object.entries(files).forEach(([key, file]) => {
    if (file) formData.append(key, file);
  });

  const response = await fetch(
    "http://srv1617582.hstgr.cloud:8084/api/fm/outlets/saveOrUpdateDocuments",
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        Authorization: token,
        // Deliberately NOT setting Content-Type here. The browser sets
        // the correct "multipart/form-data; boundary=..." header itself
        // when the body is a FormData instance — setting it manually
        // strips the boundary and breaks the upload.
      },
      body: formData,
    }
  );

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }

  console.log("[merchantService] saveOrUpdateDocuments raw response:", data);

  if (!response.ok) {
    throw new Error(
      typeof data === "string"
        ? data || "Failed to upload documents"
        : data?.message || "Failed to upload documents"
    );
  }

  return data;
};

/**
 * Get all states
 */
export const fetchStates = async () => {
  try {
    const response = await api.get("/api/fm/location/fetchStates");
    return response.data;
  } catch (error) {
    console.error("Error fetching states:", error);
    throw error;
  }
};

/**
 * Get cities for a given state
 */
export const fetchCitiesByState = async (stateId) => {
  try {
    const response = await api.get(
      `/api/fm/location/fetchCityInState?stateId=${stateId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};

/**
 * Get areas for a given city
 */
export const fetchAreasByCity = async (cityId) => {
  try {
    const response = await api.get(
      `/api/fm/location/fetchAreaInCity?cityId=${cityId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching areas:", error);
    throw error;
  }
};