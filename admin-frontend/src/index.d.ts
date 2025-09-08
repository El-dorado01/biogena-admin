export interface LoginResponse {
  message: string;
  customer_id: string;
  access_token: string;
  expires_at: string;
  email: string;
}

export interface adminDashboardResponse {
  success: boolean;
  message: string;
}

export interface subscriptionsResponse {
  success: boolean;
  message?: string;
  subscriptions: Subscription[];
  [key: string]: any;
}

interface CustomerData {
  email: string;
  name: string;
  id: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  numberOfOrders: number;
  orders: Array<{
    id: string;
    name: string;
    processedAt: string;
    totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  }>;
  state: string;
  amountSpent: { amount: string; currencyCode: string };
  verifiedEmail: boolean;
  taxExempt: boolean;
  tags: string[];
  addresses: Array<{
    id: string;
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    province: string | null;
    country: string;
    zip: string;
    phone: string | null;
    name: string;
    provinceCode: string | null;
    countryCodeV2: string;
  }>;
  defaultAddress: {
    id: string;
    address1: string;
    city: string;
    province: string | null;
    country: string;
    zip: string;
    phone: string | null;
    provinceCode: string | null;
    countryCodeV2: string;
  };
  image: {
    id: string | null;
    url: string;
    width: number | null;
    height: number | null;
  } | null;
}

export interface customerResponse {
  success: boolean;
  message?: string;
  subscriptions: Subscription[];
  data?: CustomerData;
  error?: string;
}

export interface adminCustomerResponse {
  success: boolean;
  customers: Customer[];
  total: number;
  page: number;
  has_next_page: boolean;
  [key: string]: any;
  // data: DashboardData;
}

export interface SubscriptionTermRequest {
  id: string;
  delivery_interval: string;
  s_first_name: string;
  s_last_name: string;
  s_address1: string;
  s_zip: string;
  s_city: string;
  s_country: string;
  s_province: string;
  s_country_code: string;
  s_province_code: string;
  s_address2?: string;
  restartDate?: string;
}

export interface SubscriptionActionRequest {
  id: string;
  action: string;
  billing_attempts_id?: number;
  restartDate?: string;
}

export interface SubscriptionActionResponse {
  message: string;
  subscription?: Subscription;
}

export interface DashboardData {
  customer_id: string;
  customer_email: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    orders: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          totalPrice: {
            amount: string;
            currencyCode: string;
          };
        };
      }>;
    };
  };
  subscriptions: Array<{
    id: number;
    order_placed: string;
    internal_id: number;
    delivery_interval: string;
    billing_interval: string;
    billing_attempts: { id: number; [key: string]: any }[];
    order_id: string;
    email: string;
    currency: string;
    first_name: string;
    last_name: string;
    s_first_name: string;
    s_last_name: string;
    s_address1: string;
    s_address2: string;
    s_phone: string;
    s_city: string;
    s_zip: string;
    s_province: string;
    s_country: string;
    s_company: string;
    s_country_code: string;
    s_province_code: string;
    b_first_name: string;
    b_last_name: string;
    b_address1: string;
    b_address2: string;
    b_phone: string;
    b_city: string;
    b_zip: string;
    b_province: string;
    b_country: string;
    b_company: string;
    b_country_code: string;
    b_province_code: string;
    total_value: number;
    admin_note: string;
    subscription_type: number;
    status: string;
    cancellation_reason: string;
    edit_url: string;
    cancelled_on: string;
    paused_on: string;
    card_expiry_month: string;
    card_expiry_year: string;
    items: Array<{
      id: number;
      title: string;
      quantity: number;
      [key: string]: any;
    }>;
    [key: string]: any;
  }>;
}

export interface ApiError {
  error: string;
}

export interface Order {
  id: string;
  name: string;
  processedAt: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}

export interface defaultAddress {
  id: string;
  address1: string;
  city: string;
  country: string;
  countryCodeV2: string;
  phone: string;
  province: string;
  provinceCode: string;
  zip: string;
  [key: string]: any;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  amountSpent: {
    amount: string;
    currencyCode: string;
  };
  addresses: defaultAddress[];
  defaultAddress: defaultAddress;
  defaultEmailAddress: {
    emailAddress: string;
    marketingState: string;
  };
  noOfOrders: string;
  orders?: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        totalPrice: {
          amount: string;
          currencyCode: string;
        };
      };
    }>;
  };
  verifiedEmail: boolean;
  state: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface Subscription {
  id: number;
  status: string;
  items: { id: number; title: string; quantity: number; [key: string]: any }[];
  billing_attempts?: { id: number; [key: string]: any }[];
  delivery_interval: string;
  billing_interval: string;
  total_value: string;
  currency: string;
  edit_url?: string;
  email?: string;
  s_first_name: string;
  s_last_name: string;
  s_address1: string;
  s_address2: string;
  s_phone: string;
  s_city?: string;
  s_zip?: string;
  s_province?: string;
  s_country: string;
  s_company?: string;
  s_country_code?: string;
  s_province_code?: string;
  [key: string]: any;
}
