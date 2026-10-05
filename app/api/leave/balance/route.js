import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/authServer";
import { getEmployeeLeaveBalance } from "@/services/leaveBalanceService";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        const user = await verifyUser(request);

        const { searchParams } = new URL(request.url);

        const employeeEmail = searchParams.get("employeeEmail");

        if (!employeeEmail) {
            return NextResponse.json(
                {
                    success: false,
                    message: "employeeEmail is required",
                },
                { status: 400 }
            );
        }

        const employee = await getEmployeeLeaveBalance({
            userId: user.uid,
            employeeEmail,
        });

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Employee not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employee,
        });
    } catch (error) {
        console.error("Leave balance error:", error);

        const unauthorized =
            error.message === "Unauthorized" ||
            error.message === "Missing authentication token" ||
            error.message === "Invalid authentication token";

        return NextResponse.json(
            {
                success: false,
                message: unauthorized
                    ? "Unauthorized"
                    : error.message || "Failed to get leave balance",
            },
            {
                status: unauthorized ? 401 : 500,
            }
        );
    }
}