import api from "./api";

// Get All Subscription Plans
export const getSubscriptionPlans = async () => {
  try {
    const response = await api.get("/api/fm/subscription-plans");
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
};

// Create Subscription Plan
export const createSubscriptionPlan = async (payload) => {
  try {
    const response = await api.post(
      "/api/fm/subscription-plans",
      payload
    );

    return response.data;
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    throw error;
  }
};

//Get Subscription plan by id
export const getSubscriptionPlanById = async (subscriptionPlanId) => {
  const response = await api.get("/api/fm/subscription-plans", {
    params: {
      subscriptionPlanId,
    },
  });

  return response.data;
};

//Get area by id
export const getAreaById = async (areaId) => {
  const response = await api.get("/api/fm/areas", {
    params: {
      areaId,
    },
  });

  return response.data;
};


//Delete Subscription plan
export const deleteSubscriptionPlan = async (subscriptionPlanId) => {
  const response = await api.delete(
    `/api/fm/subscription-plans/${subscriptionPlanId}`
  );

  return response.data;
};