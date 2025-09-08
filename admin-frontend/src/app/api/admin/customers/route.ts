import { NextResponse } from "next/server";
import { axios } from "@/lib/axios";
import { adminCustomerResponse } from "@/index";

export async function GET() {
  try {
    const response = await axios.get<adminCustomerResponse>("/admin/customers");
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const axiosError = error as any;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.error || "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
