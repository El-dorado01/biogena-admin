"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAdminDashboard } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

export const iframeHeight = "800px";
export const description = "A sidebar with a header and a search form.";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let toastId: string | number | undefined; // Store toastId for updating/dismissing
    async function fetchData() {
      setLoading(true);
      toastId = toast.loading("Loading dashboard data..."); // Create loading toast
      try {
        const adminDashboardData = await getAdminDashboard();
        if (adminDashboardData) {
          toast.success(adminDashboardData.message, { id: toastId }); // Update to success
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log("Error Message: ", err.message);
          if (err.message.includes("Invalid token")) {
            toast.error("Invalid token, redirecting to login...", {
              id: toastId,
            });
            router.push("/?returnTo=/admin/dashboard");
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

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <Toaster richColors position="top-center" />{" "}
      <SidebarProvider className="flex flex-col">
        <SiteHeader header="Dashboard" />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
                <div className="bg-muted/50 aspect-video rounded-xl" />
              </div>
              <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
