import { NextResponse } from "next/server";
import { sendEmail } from "@/services/gmailService";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      to,
      subject,
      message,
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        { status: 400 }
      );
    }

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          message: "to is required",
        },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message: "subject is required",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "message is required",
        },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      userId,
      to,
      subject,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      data: {
        id: result.id,
        threadId: result.threadId,
      },
    });
  } catch (error) {
    console.error("Gmail send error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}