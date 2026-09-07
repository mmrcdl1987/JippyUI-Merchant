import api from "./api";

/**
 * Get all promotion plans
 */
export const getPromotionPlans = async () => {
  try {
    const response = await api.get("/api/fm/promotion-plans");

    console.log("Promotion Plans:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching promotion plans:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    throw error;
  }
};

/* =========================================================
   GET PROMOTION PLAN BY ID
   ========================================================= */

export const getPromotionPlanById = async (promotionPlanId) => {
  const response = await api.get(
    `/api/fm/promotion-plans/${promotionPlanId}`
  );

  return response.data;
};

/* =========================================================
   GET PROMOTION SCHEDULE DETAILS
   ========================================================= */

export const getPromotionScheduleDetails = async (promotionPlanId) => {
  const response = await api.get(
    `/api/fm/promotion-plans/${promotionPlanId}/schedule-details`
  );

  return response.data;
};

/* =========================================================
   CREATE PROMOTION PLAN
   ========================================================= */

export const createPromotionPlan = async (payload) => {
  const response = await api.post(
    "/api/fm/promotion-plans",
    payload
  );

  return response.data;
};

/* =========================================================
   UPDATE PROMOTION PLAN
   ========================================================= */

export const updatePromotionPlan = async (
  promotionPlanId,
  payload
) => {
  const response = await api.put(
    `/api/fm/promotion-plans/${promotionPlanId}`,
    payload
  );

  return response.data;
};

/* =========================================================
   DELETE PROMOTION PLAN
   ========================================================= */

export const deletePromotionPlan = async (promotionPlanId) => {
  const response = await api.delete(
    `/api/fm/promotion-plans/${promotionPlanId}`
  );

  return response.data;
};

/* =========================================================
   GET PROMOTION PLANS FOR OUTLET
   ========================================================= */

export const getPromotionPlansByOutlet = async (
  outletId,
  {
    status = "ALL",
    page = 0,
    size = 10,
    sortBy = "promotionPlanId",
    direction = "DESC",
  } = {}
) => {
  const response = await api.get(
    `/api/fm/promotion-plans/outlets/${outletId}`,
    {
      params: {
        status,
        page,
        size,
        sortBy,
        direction,
      },
    }
  );

  return response.data;
};

/* =========================================================
   GET PROMOTION COUNTS FOR OUTLET
   ========================================================= */

export const getPromotionCountsByOutlet = async (outletId) => {
  const response = await api.get(
    `/api/fm/promotion-plans/outlets/${outletId}/counts`
  );

  return response.data;
};



/* =========================================================
   GET PRODUCTS FOR OUTLET
   ========================================================= */

export const getProductsByOutlet = async (outletId) => {
  try {
    const response = await api.get(
      `/api/fm/products/outlet/${outletId}`
    );

    console.log("Outlet Products:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching outlet products:", error);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);

    throw error;
  }
};



export const getPromotionPlanTypes = async () => {
  const response = await api.get("/api/fm/promotion-plan-types");
  return response.data;
};