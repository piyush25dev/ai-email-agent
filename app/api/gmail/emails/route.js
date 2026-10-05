import { NextResponse } from "next/server";
import { getInitialGmailEmails } from "../../../../services/gmailService";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");
    const limit = Number(searchParams.get("limit")) || 10;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        { status: 400 }
      );
    }

    const emails = await getInitialGmailEmails(userId, limit);

    return NextResponse.json({
      success: true,
      count: emails.length,
      data: emails,
    });
  } catch (error) {
    console.error("Gmail emails error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}