"use client";

import { getACustomer } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const SingleCustomer = () => {
  const { email } = useParams();
  const router = useRouter();
  const [customerData, setCustomerData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (!email) {
          throw new Error("Email parameter is missing");
        }

        const responseData = await getACustomer(email as string);

        if (!responseData.success) {
          throw new Error(
            responseData.error || "Failed to fetch customer data"
          );
        }

        console.log(responseData.customer)

        setCustomerData(responseData.customer);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error Message:", err.message);
          if (err.message.includes("Invalid token")) {
            toast.error("Invalid token, redirecting to login...");
            router.push("/?returnTo=/admin/customers");
          } else {
            toast.error(err.message);
            setErrorMessage(err.message);
          }
        } else {
          toast.error("An unexpected error occurred");
          setErrorMessage("An unexpected error occurred");
        }
      }
    };

    fetchCustomer();
  }, [email, router]);

//   if (errorMessage) {
//     return (
//       <div className="p-4">
//         <div
//           className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
//           role="alert"
//         >
//           <strong className="font-bold">Error: </strong>
//           <span className="block sm:inline">{errorMessage}</span>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className="p-4">
      <h1>Customer Details</h1>
      <p>Email: {email}</p>
      {customerData?.image ? (
        <img
          src={customerData.image.url}
          alt={customerData.image.alt || "Customer profile picture"}
          className="w-20 h-20 rounded-full" // Example styling for a profile pic
        />
      ) : (
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          No Image
        </div>
      )}
      {customerData ? (
        <div>
          <p>Name: {customerData.name || "N/A"}</p>
          <p>Other Info: {customerData.someField || "N/A"}</p>
        </div>
      ) : (
        <p>Loading customer data...</p>
      )}
    </div>
  );
};

export default SingleCustomer;
