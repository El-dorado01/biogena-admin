"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  Copy,
  Eye,
  MoreHorizontal,
  UploadCloud,
} from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Customer } from "@/index";
import { toast } from "sonner";
import Link from "next/link";

export const customerColumns = (
  handleSubscriptionAction: (
    id: string,
    action: string,
    billingAttemptId?: number,
    restartDate?: string
  ) => Promise<void>,
  actionLoading: boolean
): ColumnDef<Customer>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      const customer_id = row.original.id.split("/").pop();
      return <div className="font-medium">{customer_id}</div>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.original.firstName + " " + row.original.lastName;
      return <div className={`font-medium`}>{name}</div>;
    },
  },
  {
    id: "email",
    accessorKey: "defaultEmailAddress.emailAddress",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const email = row.original.defaultEmailAddress.emailAddress;
      return <div className={`font-medium`}>{email}</div>;
    },
  },
  {
    id: "Amount Spent",
    accessorKey: "amountSpent",
    header: () => <div className="text-right">Amount Spent</div>,
    cell: ({ row }) => {
      const currencyCode = row.original.amountSpent.currencyCode;
      const amount = parseFloat(row.original.amountSpent.amount);
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customers = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={actionLoading} // Ensure disabled is boolean
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <UploadCloud className="mr-2 h-4 w-4" />
              Update Email Address
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                customers.defaultEmailAddress.emailAddress &&
                  navigator.clipboard.writeText(
                    customers.defaultEmailAddress.emailAddress.toString()
                  );
                toast("Copied to clipboard.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Email
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/customers/${customers.defaultEmailAddress.emailAddress}`}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Customer Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
