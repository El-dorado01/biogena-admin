"use client"

import * as React from "react"
import {
  BookOpen,
  LayoutDashboard,
  Settings2,
  Users,
} from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0";
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logo } from "./icons/logo"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: Users,
    },
    {
      title: "Subscriptions",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "All Subscriptions",
          url: "/admin/subscriptions?q=all",
        },
        {
          title: "Active",
          url: "/admin/subscriptions?q=active",
        },
        {
          title: "Paused",
          url: "/admin/subscriptions?q=paused",
        },
        {
          title: "Cancelled",
          url: "/admin/subscriptions?q=cancelled",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const { user, isLoading, error } = useUser();
   
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex items-center justify-center w-full">
                  <Logo />
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <NavUser user={data.user} isLoading={isLoading} />
        ) : (
          <NavUser user={user!} isLoading={isLoading} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
