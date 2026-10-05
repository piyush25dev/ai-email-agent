import { NextResponse } from "next/server";
import { getGmailClient } from "../../../../services/gmailService";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient(userId);

    const response = await gmail.users.getProfile({
      userId: "me",
    });

    return NextResponse.json({
      success: true,
      message: "Gmail access verified successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Gmail profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}