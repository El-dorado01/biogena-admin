import React from "react";
import {
  getAllSubscriptions,
  performSubscriptionAction,
  updateSubDetails,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Subscription } from "@/index";
import { DataTable } from "@/components/data-table";
import { columns } from "@/components/columns";

interface SubscriptionsProps {
  query: string | null;
}

const Subscriptions = ({ query }: SubscriptionsProps) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [subData, setSubData] = useState<Subscription[]>([]);
  const router = useRouter();

  // const handleUpdateDeliveryAddress = async (id: number, delivery_interval: string) => {
  //   let toastId: string | number | undefined;
  //   setActionLoading(true);
  //   toastId = toast.loading("Updating subscription term...");
  //   try {
  //     const response = await updateSubTerm(id.toString(), delivery_interval);
  //     if (response.success) {
  //       toast.success(response.message, { id: toastId });
  //       setSubData((prev) =>
  //         prev.map((sub) =>
  //           sub.id === id ? { ...sub, ...response.subscription } : sub
  //         )
  //       );
  //     }
  //   } catch (err: any) {
  //     const status = err.response?.status;
  //     const errorMsg = err.response?.data?.error || "Action failed";
  //     if (status === 404) {
  //       toast.error(`Subscription with ID ${id} not found`);
  //     } else {
  //       toast.error(errorMsg);
  //     }
  //   } finally {
  //     setActionLoading(false);
  //   }
  // };

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

  useEffect(() => {
    let toastId: string | number | undefined;
    async function fetchData() {
      setLoading(true);
      toastId = toast.loading("Loading subscriptions from store...");
      try {
        const subscriptionsData = await getAllSubscriptions(query);
        if (subscriptionsData.success) {
          setSubData(subscriptionsData.subscriptions);
          toast.success("Subscriptions fetched successfully!", { id: toastId });
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error Message: ", err.message);
          if (err.message.includes("Invalid token")) {
            toast.error("Invalid token, redirecting to login...", {
              id: toastId,
            });
            router.push("/?returnTo=/admin/customers");
          } else {
            toast.error(err.message, { id: toastId });
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [router]);

  const memoizedColumns = React.useMemo(
    () => columns(handleUpdateSubEdit, handleSubscriptionAction, actionLoading),
    [handleUpdateSubEdit, handleSubscriptionAction, actionLoading]
  );

  return (
    <div className="container mx-auto p-5">
      <DataTable columns={memoizedColumns} data={subData} />
    </div>
  );
};

export default Subscriptions;
