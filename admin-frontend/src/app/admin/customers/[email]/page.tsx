"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getACustomer, performSubscriptionAction, updateSubDetails } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { customerResponse, Subscription } from "@/index";
import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";

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

const SingleCustomer = () => {
  const { email } = useParams();
  const router = useRouter();
  const [customerData, setCustomerData] = useState<CustomerData | undefined>(
    undefined
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subData, setSubData] = useState<Subscription[]>([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCustomer = async () => {
      try {
        if (!email) {
          throw new Error("Email parameter is missing");
        }

        setIsLoading(true);
        // const responseData = await getACustomer(email as string, {
        //   signal: controller.signal,
        // });
        const responseData = await getACustomer(email as string);

        if (!responseData.success) {
          throw new Error(
            responseData.error || "Failed to fetch customer data"
          );
        }

        if (isMounted) {
          setCustomerData(responseData.data); // Use responseData.data, not responseData.customer
          // console.log(responseData.subscriptions)
          setSubData(responseData.subscriptions);
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") return; // Ignore abort errors
          console.error("Error Message:", err.message);
          if (err.message.includes("Invalid token")) {
            toast.error("Invalid token, redirecting to login...");
            router.push("/?returnTo=/admin/customers");
          } else {
            toast.error(err.message);
            setErrorMessage(err.message);
            setIsLoading(false);
          }
        } else {
          toast.error("An unexpected error occurred");
          setErrorMessage("An unexpected error occurred");
          setIsLoading(false);
        }
      }
    };

    fetchCustomer();

    return () => {
      isMounted = false;
      controller.abort(); // Cancel fetch on unmount or email change
    };
  }, [email, router]);

  const handleUpdateSubEdit = async (
    id: number,
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
  ) => {
    let toastId: string | number | undefined;
    setActionLoading(true);
    toastId = toast.loading("Updating subscription term...");
    try {
      const response = await updateSubDetails(
        id.toString(),
        delivery_interval,
        s_first_name,
        s_last_name,
        s_address1,
        s_zip,
        s_city,
        s_country,
        s_country_code,
        s_province,
        s_province_code,
        s_address2,
        restartDate
      );
      if (response.success) {
        toast.success(response.message, { id: toastId });
        setSubData((prev) =>
          prev.map((sub) =>
            sub.id === id ? { ...sub, ...response.subscription } : sub
          )
        );
      }
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error || "Action failed";
      if (status === 404) {
        toast.error(`Subscription with ID ${id} not found`, {
          id: toastId,
        });
      } else {
        toast.error(errorMsg, {
          id: toastId,
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscriptionAction = async (
    id: number,
    action: string,
    billingAttemptId?: number,
    restartDate?: string
  ) => {
    let toastId: string | number | undefined;
    setActionLoading(true);
    toastId = toast.loading("Updating subscription status...");
    try {
      const response = await performSubscriptionAction(
        id.toString(),
        action,
        billingAttemptId,
        restartDate
      );
      if (response.success) {
        toast.success(response.message, { id: toastId });
        setSubData((prev) =>
          prev.map((sub) =>
            sub.id === id ? { ...sub, ...response.subscription } : sub
          )
        );
      }
    } catch (err: any) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error || "Action failed";
      if (status === 404) {
        toast.error(`Subscription with ID ${id} not found`, {
          id: toastId,
        });
      } else {
        toast.error(errorMsg, {
          id: toastId,
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const memoizedColumns = React.useMemo(
    () => columns(handleUpdateSubEdit, handleSubscriptionAction, actionLoading),
    [handleUpdateSubEdit, handleSubscriptionAction, actionLoading]
  );

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <Toaster richColors position="top-center" />{" "}
      <SidebarProvider className="flex flex-col">
        <SiteHeader header="Customer" />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            {errorMessage ? (
              <Card className="m-4">
                <CardContent className="pt-6">
                  <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                  >
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{errorMessage}</span>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="m-4 space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="m-4 space-y-4">
                {/* Customer Profile Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={customerData?.image?.url || ""}
                          alt={customerData?.name}
                        />
                        <AvatarFallback>
                          {customerData?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-semibold">
                          {customerData?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.phone || "No phone provided"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Customer ID</p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Account Status</p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.state}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Created At</p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.createdAt
                            ? format(new Date(customerData.createdAt), "PP")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.updatedAt
                            ? format(new Date(customerData.updatedAt), "PP")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Spent</p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.amountSpent.amount}{" "}
                          {customerData?.amountSpent.currencyCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Number of Orders</p>
                        <p className="text-sm text-muted-foreground">
                          {customerData?.numberOfOrders}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tags</p>
                      <p className="text-sm text-muted-foreground">
                        {customerData && customerData?.tags.length > 0
                          ? customerData.tags.join(", ")
                          : "None"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerData && customerData?.orders.length > 0 ? (
                      <ul className="space-y-2">
                        {customerData.orders.map((order) => (
                          <li key={order.id} className="border-b py-2">
                            <p className="text-sm font-medium">
                              Order {order.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Placed on:{" "}
                              {format(new Date(order.processedAt), "PP")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: {order.totalPriceSet.shopMoney.amount}{" "}
                              {order.totalPriceSet.shopMoney.currencyCode}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No orders found.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Addresses Card */}
                {customerData?.defaultAddress?.address1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Addresses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Default Address</p>
                          <p className="text-sm text-muted-foreground">
                            {customerData?.defaultAddress?.address1},{" "}
                            {customerData?.defaultAddress?.city},{" "}
                            {customerData?.defaultAddress?.province || ""}{" "}
                            {customerData?.defaultAddress?.country}{" "}
                            {customerData?.defaultAddress?.zip}
                          </p>
                          {customerData?.defaultAddress?.phone && (
                            <p className="text-sm text-muted-foreground">
                              Phone: {customerData.defaultAddress.phone}
                            </p>
                          )}
                        </div>
                        {customerData && customerData?.addresses.length > 0 && (
                          <div>
                            <p className="text-sm font-medium">
                              Other Addresses
                            </p>
                            <ul className="space-y-2">
                              {customerData.addresses
                                .filter(
                                  (addr) =>
                                    addr.id !== customerData.defaultAddress.id
                                )
                                .map((address) => (
                                  <li
                                    key={address.id}
                                    className="text-sm text-muted-foreground"
                                  >
                                    {address.address1}, {address.city},{" "}
                                    {address.province || ""} {address.country}{" "}
                                    {address.zip}
                                    {address.phone && (
                                      <span> (Phone: {address.phone})</span>
                                    )}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Subscriptions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={memoizedColumns} data={subData} />
                  </CardContent>
                </Card>
              </div>
            )}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default SingleCustomer;
