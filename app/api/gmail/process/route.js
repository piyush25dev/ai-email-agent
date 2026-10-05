import { NextResponse } from "next/server";
import { processRecentGmailEmails } from "@/services/gmailProcessor";
import { verifyUser } from "@/lib/authServer";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        // ==========================================
        // VERIFY FIREBASE USER
        // ==========================================

        const user = await verifyUser(request);

        // ==========================================
        // READ REQUEST BODY
        // ==========================================

        const body = await request.json().catch(() => ({}));

        const limit = Number(body.limit) || 50;

        // ==========================================
        // PROCESS GMAIL
        // ==========================================

        const result = await processRecentGmailEmails(
            user.uid,
            Math.min(limit, 100)
        );

        return NextResponse.json({
            success: true,
            message: "Gmail processing completed",
            data: result,
        });
    } catch (error) {
        console.error(
            "Gmail processing error:",
            error
        );

        const isUnauthorized =
            error.message === "Unauthorized" ||
            error.message === "Missing authentication token" ||
            error.message === "Invalid authentication token";

        return NextResponse.json(
            {
                success: false,
                message: isUnauthorized
                    ? "Unauthorized"
                    : error.message ||
                      "Failed to process Gmail",
            },
            {
                status: isUnauthorized ? 401 : 500,
            }
        );
    }
}