import { NextResponse } from "next/server";
import { sendLeaveApprovalEmail } from "@/services/managerNotificationService";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      managerEmail,
      leaveRequest,
    } = body;

    if (!userId || !managerEmail || !leaveRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "userId, managerEmail and leaveRequest are required",
        },
        { status: 400 }
      );
    }

    const result = await sendLeaveApprovalEmail({
      userId,
      managerEmail,
      leaveRequest,
    });

    return NextResponse.json({
      success: true,
      message: "Manager approval email sent successfully",
      data: {
        id: result.id,
        threadId: result.threadId,
      },
    });
  } catch (error) {
    console.error("Manager approval email error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}