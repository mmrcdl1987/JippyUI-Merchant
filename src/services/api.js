import axios from "axios";

const api = axios.create({
  baseURL: "http://187.127.156.147:8084",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
}); 

// Request Interceptor: Automatically attach Authorization token if available
api.interceptors.request.use((config) => {
  console.log("================================");
  console.log("REQUEST");
  console.log(config.method?.toUpperCase());
  console.log(config.baseURL + config.url);
  console.log(config.data);

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor: Log responses & handle errors centrally
api.interceptors.response.use(
  (response) => {
    console.log("================================");
    console.log("RESPONSE");
    console.log(response.status);
    console.log(response.data);

    return response;
  },
  (error) => {
    console.error("================================");
    console.error(error);

    return Promise.reject(error);
  }
);

export default api;