import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/authServer";
import { requireManager } from "@/lib/authorization";
import { rejectLeaveRequest } from "@/services/approvalService";

export const runtime = "nodejs";

export async function POST(request, { params }) {
    try {
        const user = await verifyUser(request);
        await requireManager(user.uid);

        const { leaveRequestId } = await params;

        if (!leaveRequestId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Leave request ID is missing",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        const data = await rejectLeaveRequest({
            userId: user.uid,
            leaveRequestId,
            managerId: user.uid,
            rejectionReason: body.rejectionReason,
        });

        return NextResponse.json({
            success: true,
            message: "Leave request rejected successfully",
            data,
        });
    } catch (error) {
        console.error("Reject leave error:", error);

        const status =
            error.code === "FORBIDDEN"
                ? 403
                : error.message === "Unauthorized" ||
                    error.message === "Missing authentication token" ||
                    error.message === "Invalid authentication token"
                  ? 401
                  : 500;

        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to reject leave request",
            },
            { status }
        );
    }
}