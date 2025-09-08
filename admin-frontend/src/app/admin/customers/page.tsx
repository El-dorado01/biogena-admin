import React from 'react'
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import Customers from './Customers';

const CustomersPage = () => {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <Toaster richColors position="top-center" />{" "}
      <SidebarProvider className="flex flex-col">
        <SiteHeader header='Customers' />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <Customers />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default CustomersPage