"use client";

import React from "react";
import { getAllCustomers } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Customer } from "@/index";
import { customerColumns } from "@/components/customers-columns";
import { DataTable } from "@/components/data-table";

const Customers = () => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const router = useRouter();

  const handleSubscriptionAction = async (
    id: string,
    action: string,
    billingAttemptId?: number,
    restartDate?: string
  ) => {
  }

  useEffect(() => {
    let toastId: string | number | undefined;
    async function fetchData() {
      setLoading(true);
      toastId = toast.loading("Loading customers from store...");
      try {
        const responseData = await getAllCustomers();
        // console.log(responseData);
        if (responseData.success) {
          setCustomersData(responseData.customers);
          toast.success("Customers fetched successfully!", { id: toastId });
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
    () => customerColumns(handleSubscriptionAction, actionLoading),
    [handleSubscriptionAction, actionLoading]
  );

  return (
    <div className="container mx-auto p-5">
      <DataTable columns={memoizedColumns} data={customersData} />
    </div>
  );
};

export default Customers;
