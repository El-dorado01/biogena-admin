import { AxiosError } from "axios";
import {
  adminCustomerResponse,
  adminDashboardResponse,
  subscriptionsResponse,
  ApiError,
  Subscription,
  customerResponse,
} from "..";

export const getAdminDashboard = async (): Promise<adminDashboardResponse> => {
  try {
    const response = await fetch("/api/admin/dashboard");

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || "Unauthorized");
    }

    const data = (await response.json()) as adminDashboardResponse;
    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unauthorized");
  }
};

export const getAllCustomers = async (): Promise<adminCustomerResponse> => {
  try {
    const response = await fetch("/api/admin/customers");

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || "Unauthorized");
    }

    const data = (await response.json()) as adminCustomerResponse;
    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unauthorized");
  }
};

export const getACustomer = async (
  email: string 
): Promise<customerResponse> => {
  try {
    const response = await fetch(`/api/admin/customers/${email}`);

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || "Unauthorized");
    }

    const data = (await response.json()) as customerResponse;
    return data;
  } catch (error) {
    console.log(error)
    throw error instanceof Error ? error : new Error("Unauthorized");
  }
};

export const getAllSubscriptions = async (
  status?: string | null
): Promise<subscriptionsResponse> => {
  try {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }

    const url = `/api/admin/subscriptions${
      status ? "?" + params.toString() : ""
    }`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || "Unauthorized");
    }

    const data = (await response.json()) as subscriptionsResponse;
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    console.error("getSubscriptions: Error:", axiosError.response?.data);
    throw axiosError;
  }
};

// export const getSubscriptionById = async (
//   accessToken: string,
//   id: string
// ): Promise<Subscription> => {
//   try {
//     const response = await api.get(`/customers/subscriptions/${id}`, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });
//     return response.data;
//   } catch (error) {
//     const axiosError = error as AxiosError<ApiError>;
//     console.error("getSubscriptionById: Error:", axiosError.response?.data);
//     throw axiosError;
//   }
// };

export const updateSubDetails = async (
  id: string,
  delivery_interval: string,
  s_first_name: string,
  s_last_name: string,
  s_address1: string,
  s_zip: string,
  s_city: string,
  s_country: string,
  s_province: string,
  s_country_code: string,
  s_province_code: string,
  s_address2?: string,
  restartDate?: string
): Promise<subscriptionsResponse> => {
  try {
    const url = "/api/admin/subscriptions/change_delivery_details";
    const data = {
      id,
      delivery_interval,
      s_first_name,
      s_last_name,
      s_address1,
      s_zip,
      s_city,
      s_country,
      s_province,
      s_country_code,
      s_province_code,
      s_address2,
      restartDate,
    };
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || "Unauthorized");
    }

    const result = (await response.json()) as subscriptionsResponse;
    return result;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    console.error("Update Sub Details: Error:", axiosError.response?.data);
    throw axiosError;
  }
};

export const performSubscriptionAction = async (
  id: string,
  action: string,
  billing_attempts_id?: number,
  restartDate?: string
): Promise<subscriptionsResponse> => {
  try {
    const url = "/api/admin/subscriptions";
    const data = {
      id,
      action,
      billing_attempts_id,
      restartDate,
    };
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.error || "Unauthorized");
    }

    const result = (await response.json()) as subscriptionsResponse;
    return result;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    console.error(
      "performSubscriptionAction: Error:",
      axiosError.response?.data
    );
    throw axiosError;
  }
};
