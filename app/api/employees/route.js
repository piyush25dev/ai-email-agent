import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const user = await verifyUser(request);
        const body = await request.json();

        const {
            employeeId,
            employeeName,
            employeeEmail,
            department,
            designation,
            casualLeave,
            sickLeave,
            annualLeave,
        } = body;

        if (!employeeId || !employeeName || !employeeEmail) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Employee ID, employee name and employee email are required",
                },
                { status: 400 }
            );
        }

        const email = employeeEmail.trim().toLowerCase();

        // Check whether employee ID already exists
        const employeeIdSnapshot = await adminDb
            .collection("users")
            .doc(user.uid)
            .collection("employees")
            .where("employeeId", "==", employeeId.trim())
            .limit(1)
            .get();

        if (!employeeIdSnapshot.empty) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Employee ID already exists",
                },
                { status: 409 }
            );
        }

        // Check whether employee email already exists
        const emailSnapshot = await adminDb
            .collection("users")
            .doc(user.uid)
            .collection("employees")
            .where("employeeEmail", "==", email)
            .limit(1)
            .get();

        if (!emailSnapshot.empty) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Employee email already exists",
                },
                { status: 409 }
            );
        }

        const employeeRef = adminDb
            .collection("users")
            .doc(user.uid)
            .collection("employees")
            .doc();

        const employeeData = {
            employeeId: employeeId.trim(),
            employeeName: employeeName.trim(),
            employeeEmail: email,
            department: department?.trim() || "",
            designation: designation?.trim() || "",

            leaveBalance: {
                casual: Number(casualLeave) || 0,
                sick: Number(sickLeave) || 0,
                annual: Number(annualLeave) || 0,
            },

            status: "ACTIVE",

            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        await employeeRef.set(employeeData);

        return NextResponse.json(
            {
                success: true,
                message: "Employee created successfully",
                data: {
                    id: employeeRef.id,
                    ...employeeData,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create employee error:", error);

        const unauthorized =
            error.message === "Unauthorized" ||
            error.message === "Missing authentication token" ||
            error.message === "Invalid authentication token";

        return NextResponse.json(
            {
                success: false,
                message: unauthorized
                    ? "Unauthorized"
                    : error.message || "Failed to create employee",
            },
            {
                status: unauthorized ? 401 : 500,
            }
        );
    }
}

export async function GET(request) {
    try {
        const user = await verifyUser(request);

        const snapshot = await adminDb
            .collection("users")
            .doc(user.uid)
            .collection("employees")
            .orderBy("createdAt", "desc")
            .get();

        const employees = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({
            success: true,
            data: employees,
        });
    } catch (error) {
        console.error("Get employees error:", error);

        const unauthorized =
            error.message === "Unauthorized" ||
            error.message === "Missing authentication token" ||
            error.message === "Invalid authentication token";

        return NextResponse.json(
            {
                success: false,
                message: unauthorized
                    ? "Unauthorized"
                    : error.message || "Failed to fetch employees",
            },
            {
                status: unauthorized ? 401 : 500,
            }
        );
    }
}