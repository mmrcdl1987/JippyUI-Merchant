import axios from "axios";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const api = axios.create({
  baseURL: "http://187.127.156.147:8084",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   REQUEST INTERCEPTOR
   Automatically attach Authorization token
   ========================================================= */

api.interceptors.request.use(
  (config) => {
    console.log("================================");
    console.log("REQUEST");
    console.log(config.method?.toUpperCase());
    console.log(
      (config.baseURL || "") + (config.url || "")
    );
    console.log(config.data);

    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("================================");
    console.error("REQUEST ERROR");
    console.error(error);

    return Promise.reject(error);
  }
);

/* =========================================================
   RESPONSE INTERCEPTOR
   Log responses & handle errors centrally
   ========================================================= */

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
    console.error("RESPONSE ERROR");
    console.error(error);

    return Promise.reject(error);
  }
);

/* =========================================================
   EXPORTS
   ========================================================= */

/*
 * Default export
 *
 * Existing imports like:
 *
 * import api from "../../services/api";
 *
 * will continue to work.
 */
export default api;


/*
 * Named export
 *
 * Existing imports like:
 *
 * import { FM_API } from "../../services/api";
 *
 * will also work.
 *
 * FM_API uses the SAME axios instance as api,
 * so the same baseURL, timeout and interceptors are used.
 */
export const FM_API = api;