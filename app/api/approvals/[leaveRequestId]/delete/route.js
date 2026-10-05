import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/authServer";
import { requireManager } from "@/lib/authorization";
import { deleteLeaveRequest } from "@/services/approvalService";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
    try {
        const user = await verifyUser(request);
        await requireManager(user.uid);

        const { leaveRequestId } = await params;

        const data = await deleteLeaveRequest({
            userId: user.uid,
            leaveRequestId,
        });

        return NextResponse.json({
            success: true,
            message: "Leave request deleted successfully",
            data,
        });
    } catch (error) {
        console.error("Delete leave error:", error);

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
                message: error.message || "Failed to delete leave request",
            },
            { status }
        );
    }
}