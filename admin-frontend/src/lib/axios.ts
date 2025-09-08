import Axios, { AxiosInstance } from "axios";
import { auth0 } from "./auth0";

const axios: AxiosInstance = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
  withXSRFToken: true,
});

axios.interceptors.request.use(
  async (config) => {
    try {
      const session = await auth0.getSession();
      const token = session?.tokenSet.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to get Auth0 token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      if (error.response?.error.includes("Invalid token"))
        console.warn("Unauthorized request, redirecting to login...");
      // redirect('/?returnTo=/admin/dashboard')
    }
    return Promise.reject(error);
  }
);

export { axios };
