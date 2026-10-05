import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendLeaveRejectionEmail } from "@/services/employeeNotificationService";

const employees = (userId) =>
    adminDb.collection("users").doc(userId).collection("employees");

const leaves = (userId) =>
    adminDb.collection("users").doc(userId).collection("leaveRequests");

function normalizeLeaveType(value) {
    const type = String(value || "").toLowerCase().trim();

    if (type.includes("sick") || type.includes("medical")) return "sick";
    if (type.includes("annual") || type.includes("earned")) return "annual";
    if (type.includes("casual")) return "casual";

    return "";
}

export async function getLeaveRequest({ userId, leaveRequestId }) {
    const ref = leaves(userId).doc(leaveRequestId);
    const snap = await ref.get();

    if (!snap.exists) throw new Error("Leave request not found");

    return { id: snap.id, ...snap.data() };
}

export async function approveLeaveRequest({
    userId,
    leaveRequestId,
    managerId,
}) {
    const db = adminDb;
    const leaveRef = leaves(userId).doc(leaveRequestId);

    return db.runTransaction(async (transaction) => {
        const leaveSnap = await transaction.get(leaveRef);

        if (!leaveSnap.exists) throw new Error("Leave request not found");

        const request = leaveSnap.data();

        if (request.status !== "PENDING") {
            throw new Error(`Leave request is already ${request.status}`);
        }

        const recordId = String(request.employeeRecordId || "").trim();
        const email = String(request.employeeEmail || "").trim().toLowerCase();

        if (!recordId && !email) {
            throw new Error("Employee information is missing");
        }

        const employeeRef = employees(userId);
        let employeeSnap = null;
        let employeeDoc = null;

        if (recordId) {
            const ref = employeeRef.doc(recordId);
            const snap = await transaction.get(ref);

            if (snap.exists) {
                employeeSnap = snap;
                employeeDoc = ref;
            }
        }

        if (!employeeSnap && recordId) {
            const q = await transaction.get(
                employeeRef.where("employeeId", "==", recordId).limit(1)
            );

            if (!q.empty) {
                employeeSnap = q.docs[0];
                employeeDoc = q.docs[0].ref;
            }
        }

        if (!employeeSnap && email) {
            const q = await transaction.get(
                employeeRef.where("employeeEmail", "==", email).limit(1)
            );

            if (!q.empty) {
                employeeSnap = q.docs[0];
                employeeDoc = q.docs[0].ref;
            }
        }

        if (!employeeSnap) throw new Error("Employee record not found");

        const employee = employeeSnap.data();

        if (
            String(employee.status || "ACTIVE").toUpperCase() !==
            "ACTIVE"
        ) {
            throw new Error("Employee is not active");
        }

        const leaveType = normalizeLeaveType(request.leaveType);
        const days = Number(request.numberOfDays || 0);

        if (!leaveType) throw new Error("Invalid leave type");
        if (!Number.isFinite(days) || days <= 0) {
            throw new Error("Invalid number of leave days");
        }

        const available = Number(
            employee.leaveBalance?.[leaveType] || 0
        );

        if (available < days) {
            throw new Error(
                `Insufficient ${leaveType} leave balance. Available: ${available}, Requested: ${days}`
            );
        }

        const remaining = available - days;

        transaction.update(employeeDoc, {
            [`leaveBalance.${leaveType}`]: remaining,
            updatedAt: FieldValue.serverTimestamp(),
        });

        transaction.update(leaveRef, {
            status: "APPROVED",
            managerId: managerId || null,
            employeeRecordId: employeeDoc.id,
            employeeId: employee.employeeId || "",
            employeeName: employee.employeeName || request.employeeName || "",
            employeeEmail: employee.employeeEmail || email,
            balanceDeducted: true,
            approvedLeaveType: leaveType,
            deductedDays: days,
            availableLeaveBalance: available,
            remainingLeaveBalance: remaining,
            approvedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return {
            id: leaveSnap.id,
            ...request,
            status: "APPROVED",
            managerId: managerId || null,
            employeeRecordId: employeeDoc.id,
            employeeId: employee.employeeId || "",
            employeeName: employee.employeeName || request.employeeName || "",
            employeeEmail: employee.employeeEmail || email,
            balanceDeducted: true,
            approvedLeaveType: leaveType,
            deductedDays: days,
            availableLeaveBalance: available,
            remainingLeaveBalance: remaining,
        };
    });
}

export async function rejectLeaveRequest({
    userId,
    leaveRequestId,
    managerId,
    rejectionReason,
}) {
    const reason = String(rejectionReason || "").trim();

    if (!reason) {
        throw new Error("Rejection reason is required");
    }

    const ref = leaves(userId).doc(leaveRequestId);
    const snap = await ref.get();

    if (!snap.exists) {
        throw new Error("Leave request not found");
    }

    const request = snap.data();

    if (request.status !== "PENDING") {
        throw new Error(`Leave request is already ${request.status}`);
    }

    await ref.update({
        status: "REJECTED",
        managerId: managerId || null,
        rejectionReason: reason,
        balanceDeducted: false,
        updatedAt: FieldValue.serverTimestamp(),
    });

    let notification = null;

    try {
        notification = await sendLeaveRejectionEmail({
            userId,
            leaveRequest: {
                id: leaveRequestId,
                ...request,
            },
            rejectionReason: reason,
        });

        await ref.update({
            employeeNotificationStatus: "SENT",
            employeeNotificationEmailId: notification?.id || null,
            employeeNotificationAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error(
            "Failed to send employee rejection email:",
            error
        );

        await ref.update({
            employeeNotificationStatus: "FAILED",
            employeeNotificationError: error.message,
        });
    }

    return {
        id: leaveRequestId,
        ...request,
        status: "REJECTED",
        managerId: managerId || null,
        rejectionReason: reason,
        balanceDeducted: false,
        employeeNotificationStatus:
            notification ? "SENT" : "FAILED",
    };
}

export async function updateLeaveRequest({
    userId,
    leaveRequestId,
    leaveType,
    startDate,
    endDate,
    reason,
}) {
    const ref = leaves(userId).doc(leaveRequestId);
    const snap = await ref.get();

    if (!snap.exists) throw new Error("Leave request not found");

    const request = snap.data();

    if (request.status !== "PENDING") {
        throw new Error("Only pending requests can be edited");
    }

    const type = normalizeLeaveType(leaveType);

    if (!type) throw new Error("Valid leave type is required");
    if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error("Invalid dates");
    }

    if (end < start) {
        throw new Error("End date cannot be before start date");
    }

    const days =
        Math.floor((end - start) / 86400000) + 1;

    const employeeRef = employees(userId);
    let employeeSnap = null;

    if (request.employeeRecordId) {
        const direct = await employeeRef.doc(request.employeeRecordId).get();

        if (direct.exists) employeeSnap = direct;
    }

    if (!employeeSnap && request.employeeEmail) {
        const q = await employeeRef
            .where("employeeEmail", "==", request.employeeEmail.toLowerCase())
            .limit(1)
            .get();

        if (!q.empty) employeeSnap = q.docs[0];
    }

    if (!employeeSnap) throw new Error("Employee record not found");

    const employee = employeeSnap.data();
    const available = Number(employee.leaveBalance?.[type] || 0);
    const sufficient = available >= days;

    await ref.update({
        leaveType: type,
        startDate,
        endDate,
        numberOfDays: days,
        requestedLeaveDays: days,
        reason: String(reason || "").trim(),
        availableLeaveBalance: available,
        balanceAvailable: sufficient,
        balanceStatus: sufficient ? "SUFFICIENT" : "INSUFFICIENT",
        balanceReason: sufficient
            ? "Sufficient leave balance"
            : `Insufficient ${type} leave balance`,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return {
        id: leaveRequestId,
        ...request,
        leaveType: type,
        startDate,
        endDate,
        numberOfDays: days,
        requestedLeaveDays: days,
        reason: String(reason || "").trim(),
        availableLeaveBalance: available,
        balanceAvailable: sufficient,
        balanceStatus: sufficient ? "SUFFICIENT" : "INSUFFICIENT",
    };
}

export async function deleteLeaveRequest({
    userId,
    leaveRequestId,
}) {
    const ref = leaves(userId).doc(leaveRequestId);
    const snap = await ref.get();

    if (!snap.exists) throw new Error("Leave request not found");

    const request = snap.data();

    if (request.status !== "PENDING") {
        throw new Error("Only pending requests can be deleted");
    }

    await ref.delete();

    return {
        id: leaveRequestId,
        status: "DELETED",
    };
}

