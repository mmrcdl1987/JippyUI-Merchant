import api from "./api";

//Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get("/api/co/orders", {
      params: {
        orderId,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};



//Rejected Orders 
export const getRejectedOrdersCount = async (driverId) => {
  try {

    const response = await api.get(
      "/api/co/order-rejections/driver/rejected-orders/count",
      {
        params: {
          driverId,
        },
      }
    );

    return response.data;

  } catch (error) {

    console.error("Error fetching rejected orders count:", error);
    throw error;

  }
};