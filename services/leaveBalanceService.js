import { adminDb } from "@/lib/firebaseAdmin";

export function normalizeLeaveType(leaveType) {
  const value = String(leaveType || "")
    .trim()
    .toLowerCase();

  if (!value) {
    return "";
  }

  // Annual leave
  if (
    value === "annual" ||
    value === "annual leave" ||
    value === "earned leave" ||
    value === "privilege leave" ||
    value === "vacation"
  ) {
    return "annual";
  }

  // Casual leave
  if (
    value === "casual" ||
    value === "casual leave" ||
    value === "cl"
  ) {
    return "casual";
  }

  // Sick leave
  if (
    value === "sick" ||
    value === "sick leave" ||
    value === "medical leave" ||
    value === "sl"
  ) {
    return "sick";
  }

  // Unknown leave type
  return "";
}

/**
 * Get employee by email.
 */
export async function getEmployeeLeaveBalance({
  userId,
  employeeEmail,
}) {
  const normalizedEmail = String(
    employeeEmail || ""
  )
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const employeesRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("employees");

  const snapshot = await employeesRef
    .where("employeeEmail", "==", employeeEmail)
    .limit(1)
    .get();

  // Exact query may fail if email casing differs.
  // Fall back to checking all employees.
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];

    return {
      employeeId: doc.id,
      ...doc.data(),
    };
  }

  const allEmployeesSnapshot =
    await employeesRef.get();

  for (const doc of allEmployeesSnapshot.docs) {
    const employee = doc.data();

    const employeeEmailFromDb =
      String(employee.employeeEmail || "")
        .trim()
        .toLowerCase();

    if (
      employeeEmailFromDb === normalizedEmail
    ) {
      return {
        employeeId: doc.id,
        ...employee,
      };
    }
  }

  return null;
}

/**
 * Check whether an employee has enough
 * balance for the requested leave type.
 */
export async function checkLeaveAvailability({
  userId,
  employeeEmail,
  leaveType,
  numberOfDays,
}) {
  // ------------------------------------------------------------
  // 1. Find employee
  // ------------------------------------------------------------

  const employee =
    await getEmployeeLeaveBalance({
      userId,
      employeeEmail,
    });

  if (!employee) {
    return {
      available: false,
      employeeFound: false,
      reason: "Employee not found",
    };
  }

  // ------------------------------------------------------------
  // 2. Check employee status
  // ------------------------------------------------------------

  if (
    String(employee.status || "")
      .trim()
      .toUpperCase() !== "ACTIVE"
  ) {
    return {
      available: false,
      employeeFound: true,
      reason: "Employee is not active",
      employee,
    };
  }

  // ------------------------------------------------------------
  // 3. Normalize leave type
  // ------------------------------------------------------------

  const normalizedLeaveType =
    normalizeLeaveType(leaveType);

  // IMPORTANT:
  // Do NOT default to casual.
  if (!normalizedLeaveType) {
    return {
      available: false,
      employeeFound: true,
      leaveType: "",
      reason:
        "Leave type is missing or invalid",
      employee,
    };
  }

  // ------------------------------------------------------------
  // 4. Validate requested days
  // ------------------------------------------------------------

  const requestedDays = Number(
    numberOfDays || 0
  );

  if (
    !Number.isFinite(requestedDays) ||
    requestedDays <= 0
  ) {
    return {
      available: false,
      employeeFound: true,
      leaveType: normalizedLeaveType,
      reason: "Invalid number of leave days",
      employee,
    };
  }

  // ------------------------------------------------------------
  // 5. Read the requested leave balance
  // ------------------------------------------------------------

  const leaveBalance =
    employee.leaveBalance || {};

  const rawAvailableDays =
    leaveBalance[normalizedLeaveType];

  const availableDays = Number(
    rawAvailableDays || 0
  );

  // ------------------------------------------------------------
  // 6. Compare balance
  // ------------------------------------------------------------

  const available =
    availableDays >= requestedDays;

  return {
    available,

    employeeFound: true,

    reason: available
      ? "Sufficient leave balance"
      : "Insufficient leave balance",

    leaveType: normalizedLeaveType,

    availableDays,

    requestedDays,

    remainingDays: Math.max(
      availableDays - requestedDays,
      0
    ),

    employee,
  };
}