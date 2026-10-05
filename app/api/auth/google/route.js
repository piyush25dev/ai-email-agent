import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "../../../../lib/gmail";

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

    const authUrl = getGoogleAuthUrl(userId);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}