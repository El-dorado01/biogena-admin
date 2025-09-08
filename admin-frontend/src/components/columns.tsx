"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  CalendarClock,
  CalendarIcon,
  ClipboardPenLine,
  Copy,
  Eye,
  Loader2,
  MoreHorizontal,
  PauseCircle,
  Play,
  PlayCircle,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Subscription } from "@/index";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export const columns = (
  handleUpdateSubEdit: (
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
  ) => Promise<void>,
  handleSubscriptionAction: (
    id: number,
    action: string,
    billingAttemptId?: number,
    restartDate?: string
  ) => Promise<void>,
  actionLoading: boolean
): ColumnDef<Subscription>[] => [
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
      const sub_id = row.original.id;
      return <div className="font-medium">{sub_id}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div
          className={`${
            status.toLowerCase() === "active"
              ? "text-green-500"
              : status.toLowerCase() === "paused"
              ? "text-yellow-500"
              : "text-red-500"
          } font-medium`}
        >
          {status}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
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
  },
  {
    id: "Delivery Interval",
    accessorKey: "delivery_interval",
    header: () => <div className="text-right">Delivery Interval</div>,
    cell: ({ row }) => {
      const delivery_interval = row.original.delivery_interval;
      return <div className="text-right font-medium">{delivery_interval}</div>;
    },
  },
  {
    id: "Total Value",
    accessorKey: "total_value",
    header: () => <div className="text-right">Total Value</div>,
    cell: ({ row }) => {
      const currency = row.original.currency;
      const total_value = parseFloat(row.original.total_value);
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(total_value);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "items",
    header: () => <div className="text-right">Items</div>,
    cell: ({ row }) => {
      const items = row.original.items.length;
      return <div className="text-right font-medium">{items}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const subscriptions = row.original;
      const status = subscriptions.status;
      const [open, setOpen] = useState(false);
      const [date, setDate] = useState<Date | undefined>(undefined);
      const [month, setMonth] = useState<Date | undefined>(undefined);
      const [value, setValue] = useState(formatDate(date));
      const [dialogOpen, setDialogOpen] = useState(false);
      const [formData, setFormData] = useState({
        s_first_name: subscriptions.s_first_name || "",
        s_last_name: subscriptions.s_last_name || "",
        delivery_interval: subscriptions.delivery_interval || "",
        s_address1: subscriptions.s_address1 || "",
        s_address2: subscriptions.s_address2 || "",
        s_city: subscriptions.s_city || "",
        s_zip: subscriptions.s_zip || "",
        s_province: subscriptions.s_province || "",
        s_country: subscriptions.s_country || "",
        s_country_code: subscriptions.s_country_code || "",
        s_province_code: subscriptions.s_province_code || "",
      });
      const [restartDateOpen, setRestartDateOpen] = useState(false);
      const [restartDate, setRestartDate] = useState<Date | undefined>(
        undefined
      );
      const [restartDateValue, setRestartDateValue] = useState(
        formatDate(undefined)
      );
      const [restartMonth, setRestartMonth] = useState<Date | undefined>(
        undefined
      );

      const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

      const isFormValid = () =>
        formData.delivery_interval &&
        formData.s_first_name &&
        formData.s_last_name &&
        formData.s_address1 &&
        formData.s_city &&
        formData.s_zip &&
        formData.s_province &&
        formData.s_province_code &&
        formData.s_country_code &&
        formData.s_country;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={actionLoading}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {status.toLowerCase() === "paused" ? (
              <DropdownMenuItem
                disabled={actionLoading}
                onClick={() =>
                  handleSubscriptionAction(subscriptions.id, "resume")
                }
              >
                <PlayCircle className="mr-2 h-4 w-4 text-green-500" />
                Resume Subscription
                {actionLoading && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
              </DropdownMenuItem>
            ) : status.toLowerCase() === "active" ? (
              <>
                <div
                  onSelect={(e) => e.preventDefault()}
                  className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  <div className="flex flex-col gap-3 w-full">
                    <span className="flex items-center">
                      <PauseCircle className="mr-2 h-4 w-4 text-yellow-500" />
                      Pause Subscription
                    </span>
                    <div className="relative flex flex-col gap-2">
                      <Label
                        htmlFor={`restart-date-${subscriptions.id}`}
                        className="px-1"
                      >
                        Optional Restart Date
                      </Label>
                      <Input
                        id={`restart-date-${subscriptions.id}`}
                        value={value}
                        placeholder="Select a date"
                        className="bg-background pr-10"
                        onChange={(e) => {
                          const inputDate = new Date(e.target.value);
                          setValue(e.target.value);
                          if (isValidDate(inputDate)) {
                            setDate(inputDate);
                            setMonth(inputDate);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setOpen(true);
                          }
                        }}
                        disabled={actionLoading}
                      />
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id={`date-picker-${subscriptions.id}`}
                            variant="ghost"
                            className="absolute top-1/2 right-2 size-6"
                            disabled={actionLoading}
                          >
                            <CalendarIcon className="size-3.5" />
                            <span className="sr-only">Select date</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="end"
                          alignOffset={-8}
                          sideOffset={10}
                        >
                          <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={(selectedDate) => {
                              setDate(selectedDate);
                              setValue(formatDate(selectedDate));
                              setOpen(false);
                            }}
                            disabled={(date) =>
                              date <
                              new Date(new Date().setDate(new Date().getDate()))
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSubscriptionAction(
                          subscriptions.id,
                          "pause",
                          undefined,
                          date ? date.toISOString().split("T")[0] : undefined
                        )
                      }
                      disabled={actionLoading}
                    >
                      Confirm Pause
                      {actionLoading && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={actionLoading}
                  onClick={() =>
                    handleSubscriptionAction(subscriptions.id, "cancel")
                  }
                >
                  <X className="mr-2 h-4 w-4 text-red-500" />
                  Cancel Subscription
                  {actionLoading && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </DropdownMenuItem>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      disabled={actionLoading}
                    >
                      <ClipboardPenLine className="mr-2 h-4 w-4" />
                      Change Delivery Address
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Change Delivery Address</DialogTitle>
                      <DialogDescription>
                        Update the delivery address and interval for this
                        subscription. Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="delivery-interval">
                          Delivery Interval
                        </Label>
                        <Select
                          name="delivery_interval"
                          value={formData.delivery_interval}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              delivery_interval: value,
                            }))
                          }
                          disabled={actionLoading}
                        >
                          <SelectTrigger
                            id="delivery-interval"
                            className="min-w-full"
                          >
                            <SelectValue placeholder="Select delivery interval" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Delivery Interval</SelectLabel>
                              <SelectItem value="1 day">Daily</SelectItem>
                              <SelectItem value="1 week">Weekly</SelectItem>
                              <SelectItem value="30 day">Monthly</SelectItem>
                              <SelectItem value="1 year">Yearly</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-center min-w-full">
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_first_name">First Name</Label>
                          <Input
                            id="s_first_name"
                            name="s_first_name"
                            value={formData.s_first_name}
                            onChange={handleInputChange}
                            placeholder="Enter first name"
                            disabled={actionLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_last_name">Last Name</Label>
                          <Input
                            id="s_last_name"
                            name="s_last_name"
                            value={formData.s_last_name}
                            onChange={handleInputChange}
                            placeholder="Enter last name"
                            disabled={actionLoading}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="s_address1">Address Line 1</Label>
                        <Input
                          id="s_address1"
                          name="s_address1"
                          value={formData.s_address1}
                          onChange={handleInputChange}
                          placeholder="Enter address line 1"
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="s_address2">
                          Address Line 2 (Optional)
                        </Label>
                        <Input
                          id="s_address2"
                          name="s_address2"
                          value={formData.s_address2}
                          onChange={handleInputChange}
                          placeholder="Enter address line 2"
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-center min-w-full">
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_city">City</Label>
                          <Input
                            id="s_city"
                            name="s_city"
                            value={formData.s_city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                            disabled={actionLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_zip">Postal Code</Label>
                          <Input
                            id="s_zip"
                            name="s_zip"
                            value={formData.s_zip}
                            onChange={handleInputChange}
                            placeholder="Enter postal code"
                            disabled={actionLoading}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-center min-w-full">
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_province">State/Province</Label>
                          <Input
                            id="s_province"
                            name="s_province"
                            value={formData.s_province}
                            onChange={handleInputChange}
                            placeholder="Enter state or province"
                            disabled={actionLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_province_code">
                            State/Province Code
                          </Label>
                          <Input
                            id="s_province_code"
                            name="s_province_code"
                            value={formData.s_province_code}
                            onChange={handleInputChange}
                            placeholder="Enter state or province code"
                            disabled={actionLoading}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-center min-w-full">
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_country">Country</Label>
                          <Input
                            id="s_country"
                            name="s_country"
                            value={formData.s_country}
                            onChange={handleInputChange}
                            placeholder="Enter country"
                            disabled={actionLoading}
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1/2 w-full">
                          <Label htmlFor="s_country_code">Country Code</Label>
                          <Input
                            id="s_country_code"
                            name="s_country_code"
                            value={formData.s_country_code}
                            onChange={handleInputChange}
                            placeholder="Enter country code"
                            disabled={actionLoading}
                          />
                        </div>
                      </div>
                      <div className="relative flex flex-col gap-2">
                        <Label
                          htmlFor={`restart-date-address-${subscriptions.id}`}
                        >
                          Optional Reset Date
                        </Label>
                        <Input
                          id={`restart-date-address-${subscriptions.id}`}
                          value={restartDateValue}
                          placeholder="Select a date"
                          className="bg-background pr-10"
                          onChange={(e) => {
                            const inputDate = new Date(e.target.value);
                            setRestartDateValue(e.target.value);
                            if (isValidDate(inputDate)) {
                              setRestartDate(inputDate);
                              setRestartMonth(inputDate);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setRestartDateOpen(true);
                            }
                          }}
                          disabled={actionLoading}
                        />
                        <Popover
                          open={restartDateOpen}
                          onOpenChange={setRestartDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              id={`date-picker-address-${subscriptions.id}`}
                              variant="ghost"
                              className="absolute top-1/2 right-2 size-6"
                              disabled={actionLoading}
                            >
                              <CalendarIcon className="size-3.5" />
                              <span className="sr-only">Select date</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                            alignOffset={-8}
                            sideOffset={10}
                          >
                            <Calendar
                              mode="single"
                              selected={restartDate}
                              captionLayout="dropdown"
                              month={restartMonth}
                              onMonthChange={setRestartMonth}
                              onSelect={(selectedDate) => {
                                setRestartDate(selectedDate);
                                setRestartDateValue(formatDate(selectedDate));
                                setRestartDateOpen(false);
                              }}
                              disabled={(date) =>
                                date <
                                new Date(
                                  new Date().setDate(new Date().getDate())
                                )
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        onClick={() => {
                          handleUpdateSubEdit(
                            subscriptions.id,
                            formData.delivery_interval,
                            formData.s_first_name,
                            formData.s_last_name,
                            formData.s_address1,
                            formData.s_zip,
                            formData.s_city,
                            formData.s_country,
                            formData.s_province,
                            formData.s_country_code,
                            formData.s_province_code,
                            formData.s_address2 || undefined,
                            restartDate
                              ? restartDate.toISOString().split("T")[0]
                              : undefined
                          );
                          setDialogOpen(false);
                        }}
                        disabled={actionLoading || !isFormValid()}
                      >
                        {actionLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <DropdownMenuItem
                disabled={actionLoading}
                onClick={() =>
                  handleSubscriptionAction(subscriptions.id, "reactivate")
                }
              >
                <Play className="mr-2 h-4 w-4 text-green-500" />
                Reactivate Subscription
                {actionLoading && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                subscriptions.email &&
                  navigator.clipboard.writeText(subscriptions.email.toString());
                toast("Copied to clipboard.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Subscription Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
