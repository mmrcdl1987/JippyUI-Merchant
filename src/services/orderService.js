import api from "./api";

/**
 * Get complete details of a single order
 */
/**
 * Get complete details of a single order
 */
export const getOrderCompleteDetails = async (orderId) => {
  try {
    const response = await api.get(
      "/api/co/customers/getOrderCompleteDetails",
      {
        params: {
          orderId: String(orderId),
        },
      }
    );

    console.log(
      "ORDER COMPLETE DETAILS RESPONSE:",
      response.data
    );

    return response.data;

  } catch (error) {
    console.error(
      "GET ORDER COMPLETE DETAILS ERROR:",
      error?.response?.status,
      error?.response?.data || error.message
    );

    throw error;
  }
};

// Get complete details of all orders flow counts
export const getCompleteOrdersFlowCounts = async () => {
  try {
    const response = await api.get(
      "/api/co/customers/getCompleteOrdersFlowCounts"
    );

    console.log("ORDER FLOW COUNTS:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "ORDER FLOW COUNTS ERROR:",
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
};


// Get complete details of all orders by order status
// Get ALL orders by order status
export const getOrdersByStatus = async (orderStatus) => {
  try {
    let allOrders = [];
    let page = 0;
    const size = 100;

    while (true) {
      const response = await api.get(
        "/api/co/customers/getCompleteOrdersDetailsByOrderStatus",
        {
          params: {
            orderStatus,
            page,
            size,
          },
        }
      );

      const data = response.data;

      const content = Array.isArray(data?.content)
        ? data.content
        : [];

      allOrders = [...allOrders, ...content];

      console.log(
        `ORDERS BY STATUS: ${orderStatus} | PAGE: ${page} | FETCHED: ${content.length}`
      );

      // Stop when backend says this is the last page
      if (data?.last === true) {
        break;
      }

      // Safety check
      if (content.length === 0) {
        break;
      }

      page++;
    }

    console.log(
      `ALL ORDERS FETCHED FOR ${orderStatus}:`,
      allOrders.length
    );

    return allOrders;
  } catch (error) {
    console.error(
      "ORDERS BY STATUS ERROR:",
      orderStatus,
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
};




export const getStates = async () => {
  return api.get("/api/fm/location/fetchStates");
};

export const getCitiesByState = async (stateId) => {
  return api.get("/api/fm/location/fetchCityInState", {
    params: {
      stateId,
    },
  });
};

export const getAreasByCity = async (cityId) => {
  return api.get("/api/fm/location/fetchAreaInCity", {
    params: {
      cityId,
    },
  });
};



export const getOrdersByMerchant = async (orderStatus) => {
  try {
    // Get outlets belonging to logged-in merchant
    const outletResponse = await api.get(
      "/api/fm/outlets/getOutletsByMerchant"
    );

    const outlets = Array.isArray(outletResponse.data)
      ? outletResponse.data
      : [];

    console.log("MERCHANT OUTLETS:", outlets);

    if (outlets.length === 0) {
      return [];
    }

    // Collect outlet IDs
    const merchantOutletIds = outlets.map(
      (outlet) => String(outlet.outletId ?? outlet.id)
    );

    console.log("MERCHANT OUTLET IDS:", merchantOutletIds);

    // Fetch orders
    let allOrders = [];
    let page = 0;
    const size = 100;

    while (true) {
      const response = await api.get(
        "/api/co/customers/getCompleteOrdersDetailsByOrderStatus",
        {
          params: {
            orderStatus,
            page,
            size,
          },
        }
      );

      const data = response.data;

      const content = Array.isArray(data?.content)
        ? data.content
        : [];

      // Keep only orders belonging to merchant outlets
      const merchantOrders = content.filter((order) => {
        const orderOutletId = String(
          order.outletId ??
          order.restaurantId ??
          order.outlet?.outletId ??
          order.restaurant?.outletId ??
          ""
        );

        return merchantOutletIds.includes(orderOutletId);
      });

      allOrders = [...allOrders, ...merchantOrders];

      console.log(
        `STATUS: ${orderStatus} | PAGE: ${page} | TOTAL: ${content.length} | MERCHANT: ${merchantOrders.length}`
      );

      if (data?.last === true || content.length === 0) {
        break;
      }

      page++;
    }

    console.log(
      `MERCHANT ORDERS FOR ${orderStatus}:`,
      allOrders.length
    );

    return allOrders;
  } catch (error) {
    console.error(
      "MERCHANT ORDERS ERROR:",
      orderStatus,
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
}; 