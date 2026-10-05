import { NextResponse } from "next/server";
import { createGoogleOAuthClient } from "../../../../lib/gmail";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../../../../lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization code is missing",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is missing",
        },
        { status: 400 }
      );
    }

    const oauth2Client = createGoogleOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    console.log("Google OAuth successful");
    console.log("Has access token:", !!tokens.access_token);
    console.log("Has refresh token:", !!tokens.refresh_token);

    const integrationRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("google");

    const existingSnapshot = await integrationRef.get();

    const existingData = existingSnapshot.exists
      ? existingSnapshot.data()
      : {};

    await integrationRef.set(
      {
        accessToken:
          tokens.access_token ||
          existingData.accessToken ||
          null,

        refreshToken:
          tokens.refresh_token ||
          existingData.refreshToken ||
          null,

        scope:
          tokens.scope ||
          existingData.scope ||
          null,

        tokenType:
          tokens.token_type ||
          existingData.tokenType ||
          "Bearer",

        expiryDate:
          tokens.expiry_date ||
          null,

        connected: true,

        provider: "google",

        needsReauth: false,

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Google account connected successfully",
      userId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!(
        tokens.refresh_token ||
        existingData.refreshToken
      ),
    });
  } catch (error) {
    console.error("GOOGLE CALLBACK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Google OAuth failed",
      },
      { status: 500 }
    );
  }
}