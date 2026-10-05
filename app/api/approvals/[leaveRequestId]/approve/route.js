import { NextResponse } from "next/server";
import { approveLeaveRequest } from "@/services/approvalService";
import { sendLeaveDecisionEmail } from "@/services/notificationService";
import { createActivityLog } from "@/services/activityService";
import { verifyUser } from "@/lib/authServer";
import { requireManager } from "@/lib/authorization";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    try {
        // ==========================================
        // VERIFY FIREBASE USER
        // ==========================================

        const user = await verifyUser(request);

        // ==========================================
        // VERIFY MANAGER AUTHORIZATION
        // ==========================================

        await requireManager(user.uid);

        const { leaveRequestId } = await params;

        if (!leaveRequestId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Leave request ID is required",
                },
                { status: 400 }
            );
        }

        // ==========================================
        // APPROVE LEAVE REQUEST
        // ==========================================

        const leaveRequest = await approveLeaveRequest({
            userId: user.uid,
            leaveRequestId,
            managerId: user.uid,
        });

        // ==========================================
        // ACTIVITY LOG
        // ==========================================

        await createActivityLog({
            userId: user.uid,
            type: "APPROVED",
            message: `Leave request approved for ${leaveRequest.employeeName}`,
            metadata: {
                leaveRequestId: leaveRequest.id,
                managerId: user.uid,
            },
        });

        // ==========================================
        // NOTIFY EMPLOYEE
        // ==========================================

        const emailResult = await sendLeaveDecisionEmail({
            userId: user.uid,
            leaveRequest,
        });

        // ==========================================
        // LOG EMPLOYEE NOTIFICATION
        // ==========================================

        await createActivityLog({
            userId: user.uid,
            type: "LEAVE_NOTIFICATION_SENT",
            message: `Approval notification sent to ${leaveRequest.employeeEmail}`,
            metadata: {
                leaveRequestId: leaveRequest.id,
                employeeEmail: leaveRequest.employeeEmail,
                emailId: emailResult.id || null,
                status: "APPROVED",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Leave request approved and employee notified",
            data: {
                id: leaveRequest.id,
                employeeName: leaveRequest.employeeName,
                employeeEmail: leaveRequest.employeeEmail,
                status: leaveRequest.status,
            },
        });
    } catch (error) {
        console.error("Approve leave request error:", error);

        const isUnauthorized =
            error.message === "Unauthorized" ||
            error.message === "Missing authentication token" ||
            error.message === "Invalid authentication token";

        const isForbidden =
            error.code === "FORBIDDEN";

        return NextResponse.json(
            {
                success: false,
                message: isForbidden
                    ? "You are not authorized to approve leave requests"
                    : isUnauthorized
                        ? "Unauthorized"
                        : error.message ||
                          "Failed to approve leave request",
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