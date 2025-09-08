import { NextResponse } from "next/server";
import { axios } from "@/lib/axios";
import { ApiError, customerResponse } from "@/index";

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    console.log("Api triggered!!!")
    const { email } = await params;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is missing" },
        { status: 400 }
      );
    }

    const response = await axios.get<customerResponse>(`/admin/customers/${email}`);
    // const data = await response.json() as customerResponse | ApiError;

    if (!response.data.success) {
      return NextResponse.json(
        { success: false, error: response.data.error || 'Failed to fetch customer' },
        { status: response.status }
      );
    }
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const axiosError = error as any;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.error || "Internal Server Error";
    console.log("API error: ", message)
    return NextResponse.json({ error: message }, { status });
  }
}
