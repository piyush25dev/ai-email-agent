import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";
import { requireManager } from "@/lib/authorization";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        const user = await verifyUser(request);
        await requireManager(user.uid);

        const userRef = adminDb.collection("users").doc(user.uid);

        const [
            emailsSnapshot,
            leaveRequestsSnapshot,
            activitySnapshot,
            allActivitySnapshot,
        ] = await Promise.all([
            userRef.collection("emails").get(),

            userRef.collection("leaveRequests").get(),

            userRef
                .collection("activityLogs")
                .orderBy("createdAt", "desc")
                .limit(10)
                .get(),

            userRef.collection("activityLogs").get(),
        ]);

        // ==========================================
        // EMAIL STATISTICS
        // ==========================================

        const totalEmails = emailsSnapshot.size;

        let aiProcessed = 0;

        emailsSnapshot.forEach((doc) => {
            const data = doc.data();

            if (data.analysis) {
                aiProcessed++;
            }
        });

        // ==========================================
        // LEAVE REQUEST STATISTICS
        // ==========================================

        let pendingActions = 0;
        let approved = 0;
        let rejected = 0;

        leaveRequestsSnapshot.forEach((doc) => {
            const data = doc.data();

            const status = String(
                data.status || "PENDING"
            ).toUpperCase();

            if (status === "PENDING") {
                pendingActions++;
            }

            if (status === "APPROVED") {
                approved++;
            }

            if (status === "REJECTED") {
                rejected++;
            }
        });

        // ==========================================
        // EMAIL SENT STATISTICS
        // ==========================================

        let emailsSent = 0;

        allActivitySnapshot.forEach((doc) => {
            const data = doc.data();

            if (
                data.type === "LEAVE_NOTIFICATION_SENT" ||
                data.type === "MANAGER_NOTIFIED"
            ) {
                emailsSent++;
            }
        });

        // ==========================================
        // RECENT ACTIVITY
        // ==========================================

        const recentActivity = activitySnapshot.docs.map((doc) => {
            const data = doc.data();

            let createdAt = null;

            if (data.createdAt) {
                if (
                    typeof data.createdAt.toDate ===
                    "function"
                ) {
                    createdAt = data.createdAt
                        .toDate()
                        .toISOString();
                } else if (
                    data.createdAt instanceof Date
                ) {
                    createdAt = data.createdAt.toISOString();
                } else {
                    createdAt = data.createdAt;
                }
            }

            return {
                id: doc.id,
                type: data.type || "ACTIVITY",
                message: data.message || "",
                emailId: data.emailId || null,
                metadata: data.metadata || {},
                createdAt,
            };
        });

        // ==========================================
        // RESPONSE
        // ==========================================

        return NextResponse.json({
            success: true,

            data: {
                statistics: {
                    totalEmails,
                    aiProcessed,
                    pendingActions,
                    approved,
                    rejected,
                    emailsSent,
                },

                recentActivity,
            },
        });
    } catch (error) {
        console.error(
            "Dashboard stats error:",
            error
        );

        const isUnauthorized =
            error.message === "Unauthorized" ||
            error.message ===
                "Missing authentication token" ||
            error.message ===
                "Invalid authentication token";

        const isForbidden =
            error.code === "FORBIDDEN";

        return NextResponse.json(
            {
                success: false,

                message: isForbidden
                    ? "You are not authorized to view the dashboard"
                    : isUnauthorized
                      ? "Unauthorized"
                      : error.message ||
                        "Failed to load dashboard",
            },
            {
                status: isForbidden
                    ? 403
                    : isUnauthorized
                      ? 401
                      : 500,
            }
        );
    }
}