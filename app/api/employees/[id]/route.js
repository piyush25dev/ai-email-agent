import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";

export async function PATCH(request, { params }) {
    try {
        const user = await verifyUser(request);
        const userId = user.uid;

        const { id } = await params;

        if (!id) {
            return Response.json(
                {
                    success: false,
                    message: "Employee ID is missing",
                },
                { status: 400 }
            );
        }

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
            status,
        } = body;

        if (!employeeId || !employeeName || !employeeEmail) {
            return Response.json(
                {
                    success: false,
                    message:
                        "Employee ID, employee name and employee email are required",
                },
                { status: 400 }
            );
        }

        const employeeRef = adminDb
            .collection("users")
            .doc(userId)
            .collection("employees")
            .doc(id);

        const employeeSnapshot = await employeeRef.get();

        if (!employeeSnapshot.exists) {
            return Response.json(
                {
                    success: false,
                    message: "Employee not found",
                },
                { status: 404 }
            );
        }

        // Check duplicate employee ID
        const duplicateIdSnapshot = await adminDb
            .collection("users")
            .doc(userId)
            .collection("employees")
            .where("employeeId", "==", employeeId)
            .get();

        const duplicateId = duplicateIdSnapshot.docs.find(
            (doc) => doc.id !== id
        );

        if (duplicateId) {
            return Response.json(
                {
                    success: false,
                    message: "Employee ID already exists",
                },
                { status: 409 }
            );
        }

        // Check duplicate email
        const duplicateEmailSnapshot = await adminDb
            .collection("users")
            .doc(userId)
            .collection("employees")
            .where("employeeEmail", "==", employeeEmail.toLowerCase().trim())
            .get();

        const duplicateEmail = duplicateEmailSnapshot.docs.find(
            (doc) => doc.id !== id
        );

        if (duplicateEmail) {
            return Response.json(
                {
                    success: false,
                    message: "Employee email already exists",
                },
                { status: 409 }
            );
        }

        await employeeRef.update({
            employeeId: employeeId.trim(),
            employeeName: employeeName.trim(),
            employeeEmail: employeeEmail.toLowerCase().trim(),
            department: department?.trim() || "",
            designation: designation?.trim() || "",
            leaveBalance: {
                casual: Number(casualLeave) || 0,
                sick: Number(sickLeave) || 0,
                annual: Number(annualLeave) || 0,
            },
            status: status || "ACTIVE",
            updatedAt: FieldValue.serverTimestamp(),
        });

        return Response.json({
            success: true,
            message: "Employee updated successfully",
        });
    } catch (error) {
        console.error("UPDATE EMPLOYEE ERROR:", error);

        return Response.json(
            {
                success: false,
                message: error.message || "Failed to update employee",
            },
            { status: 500 }
        );
    }
}


export async function DELETE(request, { params }) {
    try {
        const user = await verifyUser(request);
        const userId = user.uid;

        const { id } = await params;

        console.log("DELETE employee:", {
            userId,
            employeeId: id,
        });

        if (!userId) {
            return Response.json(
                {
                    success: false,
                    message: "User authentication failed",
                },
                { status: 401 }
            );
        }

        if (!id) {
            return Response.json(
                {
                    success: false,
                    message: "Employee ID is missing",
                },
                { status: 400 }
            );
        }

        const employeeRef = adminDb
            .collection("users")
            .doc(userId)
            .collection("employees")
            .doc(id);

        const employeeSnapshot = await employeeRef.get();

        if (!employeeSnapshot.exists) {
            return Response.json(
                {
                    success: false,
                    message: "Employee not found",
                },
                { status: 404 }
            );
        }

        await employeeRef.delete();

        return Response.json({
            success: true,
            message: "Employee deleted successfully",
        });
    } catch (error) {
        console.error("DELETE EMPLOYEE ERROR:", error);

        return Response.json(
            {
                success: false,
                message: error.message || "Failed to delete employee",
            },
            { status: 500 }
        );
    }
}