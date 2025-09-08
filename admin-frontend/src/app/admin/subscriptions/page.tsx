
"use client"
import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import Subscriptions from "./Subscriptions";
import { useSearchParams } from "next/navigation";

interface PageProps {
    searchParams: { [key: string]: string | string[] }
}
// const SubscriptionsPage = async ({ searchParams }: PageProps) => {
const SubscriptionsPage = () => {
    const searchParams = useSearchParams();
    const query = searchParams.get('q')
    
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <Toaster richColors position="top-center" />{" "}
      <SidebarProvider className="flex flex-col">
        <SiteHeader header="Subscriptions" />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <Subscriptions query={query} />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default SubscriptionsPage;
