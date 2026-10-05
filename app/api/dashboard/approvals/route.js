import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";
import { requireManager } from "@/lib/authorization";
import { checkLeaveAvailability } from "@/services/leaveBalanceService";

export const runtime = "nodejs";

/**
 * Normalize employee email addresses
 */
function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/**
 * Convert Firestore timestamps / dates / strings
 * into a consistent ISO string.
 */
function convertDate(value) {
  if (!value) {
    return null;
  }

  // Firestore Timestamp
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  // JavaScript Date
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Unix timestamp
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  // ISO/string date
  if (typeof value === "string") {
    return value;
  }

  // Firestore serialized timestamp
  if (value?._seconds !== undefined) {
    return new Date(value._seconds * 1000).toISOString();
  }

  return null;
}

export async function GET(request) {
  try {
    // ============================================================
    // 1. VERIFY LOGGED-IN USER
    // ============================================================

    const user = await verifyUser(request);

    // ============================================================
    // 2. VERIFY MANAGER / ADMIN ACCESS
    // ============================================================

    await requireManager(user.uid);

    const userRef = adminDb
      .collection("users")
      .doc(user.uid);

    // ============================================================
    // 3. GET REGISTERED EMPLOYEES
    // ============================================================

    const employeesSnapshot = await userRef
      .collection("employees")
      .get();

    const employeeEmails = new Set();

    employeesSnapshot.forEach((doc) => {
      const employee = doc.data();

      const email = normalizeEmail(
        employee.employeeEmail
      );

      if (email) {
        employeeEmails.add(email);
      }
    });

    // No employees registered
    if (employeeEmails.size === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // ============================================================
    // 4. GET ALL LEAVE REQUESTS
    // ============================================================

    const snapshot = await userRef
      .collection("leaveRequests")
      .get();

    // ============================================================
    // 5. FILTER + PROCESS LEAVE REQUESTS
    // ============================================================

    const requests = await Promise.all(
      snapshot.docs
        .filter((doc) => {
          const data = doc.data();

          const employeeEmail = normalizeEmail(
            data.employeeEmail
          );

          // Only show requests belonging to
          // registered employees.
          return employeeEmails.has(employeeEmail);
        })
        .map(async (doc) => {
          const data = doc.data();

          const employeeEmail = normalizeEmail(
            data.employeeEmail
          );

          // ========================================================
          // BASIC LEAVE INFORMATION
          // ========================================================

          const requestedDays = Number(
            data.requestedLeaveDays ||
              data.numberOfDays ||
              0
          );

          let leaveType =
            data.leaveType || "";

          // ========================================================
          // EXISTING BALANCE INFORMATION
          // ========================================================

          let balanceAvailable =
            data.balanceAvailable ?? null;

          let availableLeaveBalance =
            data.availableLeaveBalance ?? null;

          let balanceStatus =
            data.balanceStatus ?? null;

          let balanceReason =
            data.balanceReason ?? null;

          // ========================================================
          // 6. CALCULATE BALANCE IF MISSING
          //
          // This is especially important for old leave requests
          // created before balance information was stored.
          // ========================================================

          if (
            balanceAvailable === null ||
            availableLeaveBalance === null ||
            balanceStatus === null
          ) {
            try {
              const balanceCheck =
                await checkLeaveAvailability({
                  userId: user.uid,
                  employeeEmail,
                  leaveType,
                  numberOfDays: requestedDays,
                });


              // ====================================================
              // EMPLOYEE FOUND
              // ====================================================

              if (balanceCheck.employeeFound) {
                balanceAvailable =
                  Boolean(
                    balanceCheck.available
                  );

                availableLeaveBalance =
                  Number(
                    balanceCheck.availableDays || 0
                  );

                balanceStatus =
                  balanceCheck.available
                    ? "SUFFICIENT"
                    : "INSUFFICIENT";

                balanceReason =
                  balanceCheck.reason ||
                  null;

                // checkLeaveAvailability()
                // returns the normalized leave type.
                leaveType =
                  balanceCheck.leaveType ||
                  leaveType;

                // ==================================================
                // 7. SAVE CALCULATED BALANCE TO FIRESTORE
                //
                // This means old requests are automatically
                // repaired when the Approvals API is opened.
                // ==================================================

                await doc.ref.update({
                  balanceAvailable:
                    Boolean(
                      balanceCheck.available
                    ),

                  availableLeaveBalance:
                    Number(
                      balanceCheck.availableDays ||
                        0
                    ),

                  requestedLeaveDays:
                    Number(
                      balanceCheck.requestedDays ||
                        requestedDays
                    ),

                  balanceStatus:
                    balanceCheck.available
                      ? "SUFFICIENT"
                      : "INSUFFICIENT",

                  balanceReason:
                    balanceCheck.reason ||
                    null,

                  leaveType:
                    balanceCheck.leaveType ||
                    leaveType,

                  updatedAt:
                    new Date(),
                });
              } else {
                // ==================================================
                // EMPLOYEE NOT FOUND
                // ==================================================

                balanceAvailable = false;

                availableLeaveBalance = null;

                balanceStatus = "UNAVAILABLE";

                balanceReason =
                  balanceCheck.reason ||
                  "Employee not found";
              }
            } catch (balanceError) {
              console.error(
                "Leave balance calculation failed:",
                {
                  leaveRequestId: doc.id,
                  employeeEmail,
                  error: balanceError,
                }
              );

              balanceAvailable = null;

              availableLeaveBalance = null;

              balanceStatus = "UNAVAILABLE";

              balanceReason =
                "Unable to calculate leave balance";
            }
          }

          // ========================================================
          // 8. RETURN FORMATTED REQUEST
          // ========================================================

          return {
            id: doc.id,

            emailId:
              data.emailId || null,

            employeeRecordId:
              data.employeeRecordId || null,

            employeeName:
              data.employeeName || "",

            employeeEmail:
              data.employeeEmail || "",

            leaveType,

            startDate:
              data.startDate || null,

            endDate:
              data.endDate || null,

            numberOfDays:
              Number(
                data.numberOfDays || 0
              ),

            reason:
              data.reason || "",

            status:
              data.status || "PENDING",

            managerId:
              data.managerId || null,

            // ====================================================
            // BALANCE INFORMATION
            // ====================================================

            balanceDeducted:
              Boolean(
                data.balanceDeducted
              ),

            deductedDays:
              Number(
                data.deductedDays || 0
              ),

            remainingLeaveBalance:
              data.remainingLeaveBalance ??
              null,

            balanceAvailable,

            availableLeaveBalance,

            requestedLeaveDays:
              Number(
                data.requestedLeaveDays ||
                  data.numberOfDays ||
                  0
              ),

            balanceStatus,

            balanceReason,

            // ====================================================
            // APPROVAL INFORMATION
            // ====================================================

            approvedLeaveType:
              data.approvedLeaveType ||
              null,

            rejectionReason:
              data.rejectionReason ||
              null,

            // ====================================================
            // MANAGER NOTIFICATION
            // ====================================================

            managerNotificationStatus:
              data.managerNotificationStatus ||
              null,

            managerNotificationEmailId:
              data.managerNotificationEmailId ||
              null,

            // ====================================================
            // DATES
            // ====================================================

            createdAt:
              convertDate(
                data.createdAt
              ),

            updatedAt:
              convertDate(
                data.updatedAt
              ),
          };
        })
    );

    // ============================================================
    // 9. SORT NEWEST REQUESTS FIRST
    // ============================================================

    requests.sort((a, b) => {
      const dateA = new Date(
        a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || 0
      ).getTime();

      return dateB - dateA;
    });

    // ============================================================
    // 10. RETURN RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error(
      "Approvals API error:",
      error
    );

    // ============================================================
    // 11. HANDLE AUTHORIZATION ERROR
    // ============================================================

    const status =
      error.code === "FORBIDDEN"
        ? 403
        : error.message === "Unauthorized"
        ? 401
        : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to fetch approval requests",
      },
      {
        status,
      }
    );
  }
}