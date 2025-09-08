import { NextRequest, NextResponse } from "next/server";
import { axios } from "@/lib/axios";
import {
  subscriptionsResponse,
  SubscriptionActionRequest,
  SubscriptionActionResponse,
} from "@/index";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const response = await axios.get<subscriptionsResponse>(
      "/admin/subscriptions",
      {
        params: status ? { status } : {},
      }
    );

    return NextResponse.json(response.data, {
      status: response.status,
    });
  } catch (error) {
    const axiosError = error as any;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.error || "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body: SubscriptionActionRequest = await req.json();

    // Validate input
    if (!body.id || !body.action) {
      return NextResponse.json(
        { error: "Subscription ID and action are required" },
        { status: 400 }
      );
    }

    if (!["pause", "resume", "cancel", "reactivate"].includes(body.action)) {
      return NextResponse.json(
        {
          error:
            "Invalid action. Supported actions: pause, resume, cancel, reactivate",
        },
        { status: 400 }
      );
    }

    if (body.action === "pause" && body.restartDate) {
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
      `/admin/subscriptions/${body.id}/${body.action}`,
      {
        id: body.id,
        action: body.action,
        billing_attempts_id: body.billing_attempts_id,
        restart_date: body.restartDate,
      }
    );

    return NextResponse.json(response.data, {
      status: response.status,
    });
  } catch (error) {
    const axiosError = error as any;
    const status = axiosError.response?.status || 500;
    const message = axiosError.response?.data?.error || "Internal Server Error";
    return NextResponse.json({ error: message }, { status });
  }
}
