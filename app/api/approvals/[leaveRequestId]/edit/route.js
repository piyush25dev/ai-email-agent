import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/authServer";
import { requireManager } from "@/lib/authorization";
import { updateLeaveRequest } from "@/services/approvalService";

export const runtime = "nodejs";

export async function PUT(request, { params }) {
    try {
        const user = await verifyUser(request);
        await requireManager(user.uid);

        const { leaveRequestId } = await params;
        const body = await request.json();

        const data = await updateLeaveRequest({
            userId: user.uid,
            leaveRequestId,
            ...body,
        });

        return NextResponse.json({
            success: true,
            message: "Leave request updated successfully",
            data,
        });
    } catch (error) {
        console.error("Edit leave error:", error);

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
                message: error.message || "Failed to update leave request",
            },
            { status }
        );
    }
}