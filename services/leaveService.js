import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebaseAdmin";

export async function createLeaveRequest({
  userId,
  emailId,
  extractedData,
  employeeRecordId = null,
  balanceCheck = null,
}) {
  const leaveRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("leaveRequests")
    .doc();

  const requestedDays = Number(
    balanceCheck?.requestedDays ||
    extractedData.numberOfDays ||
    0
  );

  const availableDays =
    balanceCheck?.availableDays !== undefined
      ? Number(balanceCheck.availableDays)
      : null;

  const leaveData = {
    emailId,

    employeeRecordId:
      employeeRecordId || null,

    employeeName:
      extractedData.employeeName || "",

    employeeEmail:
      extractedData.employeeEmail || "",

    leaveType:
      balanceCheck?.leaveType ||
      extractedData.leaveType ||
      "",

    startDate:
      extractedData.startDate || null,

    endDate:
      extractedData.endDate || null,

    numberOfDays: requestedDays,

    reason:
      extractedData.reason || "",

    status: "PENDING",

    managerId: null,

    balanceDeducted: false,

    // =====================================
    // Leave balance information
    // =====================================

    balanceAvailable:
      balanceCheck?.available ?? null,

    availableLeaveBalance:
      availableDays,

    requestedLeaveDays:
      requestedDays,

    balanceStatus:
      balanceCheck
        ? balanceCheck.available
          ? "SUFFICIENT"
          : "INSUFFICIENT"
        : null,

    balanceReason:
      balanceCheck?.reason || null,

    createdAt:
      FieldValue.serverTimestamp(),

    updatedAt:
      FieldValue.serverTimestamp(),
  };

  await leaveRef.set(leaveData);

  return {
    id: leaveRef.id,

    emailId,

    employeeRecordId:
      leaveData.employeeRecordId,

    employeeName:
      leaveData.employeeName,

    employeeEmail:
      leaveData.employeeEmail,

    leaveType:
      leaveData.leaveType,

    startDate:
      leaveData.startDate,

    endDate:
      leaveData.endDate,

    numberOfDays:
      leaveData.numberOfDays,

    reason:
      leaveData.reason,

    status:
      leaveData.status,

    balanceDeducted:
      leaveData.balanceDeducted,

    balanceAvailable:
      leaveData.balanceAvailable,

    availableLeaveBalance:
      leaveData.availableLeaveBalance,

    requestedLeaveDays:
      leaveData.requestedLeaveDays,

    balanceStatus:
      leaveData.balanceStatus,

    balanceReason:
      leaveData.balanceReason,
  };
}