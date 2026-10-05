import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const user = await verifyUser(request);

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;

    const snapshot = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("activityLogs")
      .limit(Math.min(limit, 100))
      .get();

    const activities = snapshot.docs.map((doc) => {
      const data = doc.data();

      let createdAt = null;

      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt.toISOString();
        } else {
          createdAt = data.createdAt;
        }
      }

      return {
        id: doc.id,
        type: data.type || "UNKNOWN",
        message: data.message || "",
        emailId: data.emailId || null,
        metadata: data.metadata || {},
        createdAt,
      };
    });

    activities.sort(
      (a, b) =>
        (b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0) -
        (a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0)
    );

    return NextResponse.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("Activity API error:", error);

    const status =
      error.message === "Unauthorized" ||
      error.message === "Missing authentication token" ||
      error.message === "Invalid authentication token"
        ? 401
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status === 401
            ? "Unauthorized"
            : error.message || "Failed to load activity",
      },
      { status }
    );
  }
}