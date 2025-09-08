import { NextRequest, NextResponse } from "next/server";
import { axios } from "@/lib/axios";
import { SubscriptionTermRequest, SubscriptionActionResponse } from "@/index";

export async function PUT(req: NextRequest) {
  try {
    const body: SubscriptionTermRequest = await req.json();
    console.log(body);
    

    // Validate input
    if (!body.id || !body.delivery_interval) {
      return NextResponse.json(
        { error: "Subscription ID and delivery interval are required" },
        { status: 400 }
      );
    }

    if (body.restartDate) {
      // Validate restartDate format (e.g., YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (
        !dateRegex.test(body.restartDate) ||
        isNaN(new Date(body.restartDate).getTime())
      ) {
        return NextResponse.json(
          { error: "Invalid restartDate format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
      // Ensure restartDate is in the future
      const restartDate = new Date(body.restartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      if (restartDate <= today) {
        return NextResponse.json(
          { error: "restartDate must be a future date" },
          { status: 400 }
        );
      }
    }

    // Make the backend API call
    const response = await axios.put<SubscriptionActionResponse>(
      `/admin/subscriptions/${body.id}/updateSubDetails`,
      {
        id: body.id,
        delivery_interval: body.delivery_interval,
        s_first_name: body.s_first_name,
        s_last_name: body.s_last_name,
        s_address1: body.s_address1,
        s_zip: body.s_zip,
        s_city: body.s_city,
        s_country: body.s_country,
        s_province: body.s_province,
        s_country_code: body.s_country_code,
        s_province_code: body.s_province_code,
        s_address2: body.s_address2,
        restartDate: body.restartDate,
      }
    );

    return NextResponse.json(response.data, {
      status: response.status,
    });
  } catch (error) {
    const axiosError = error as any;
    console.log("Route API Error: ", axiosError);
    
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.error || "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
