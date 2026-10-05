import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";

export const runtime = "nodejs";

// ============================================================
// Helpers
// ============================================================

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeString(value) {
  return String(value ?? "").trim();
}

function parseLeaveValue(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (number < 0) {
    return null;
  }

  return number;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// POST - Bulk employee import
// ============================================================

export async function POST(request) {
  try {
    // --------------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------------

    const user = await verifyUser(request);

    if (!user?.uid) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------------
    // 2. Read request
    // --------------------------------------------------------

    const body = await request.json();

    const employees = body?.employees;

    if (!Array.isArray(employees)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employees must be provided as an array.",
        },
        { status: 400 }
      );
    }

    if (employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No employees found in the file.",
        },
        { status: 400 }
      );
    }

    // Prevent accidentally huge uploads.
    if (employees.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum 500 employees can be imported at once.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 3. Firestore reference
    // --------------------------------------------------------

    const employeesRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("employees");

    // --------------------------------------------------------
    // 4. Get existing employees
    // --------------------------------------------------------

    const existingSnapshot =
      await employeesRef.get();

    const existingEmployeeIds = new Set();
    const existingEmails = new Set();

    existingSnapshot.forEach((doc) => {
      const employee = doc.data();

      const employeeId =
        normalizeString(
          employee.employeeId
        ).toLowerCase();

      const email =
        normalizeEmail(
          employee.employeeEmail
        );

      if (employeeId) {
        existingEmployeeIds.add(
          employeeId
        );
      }

      if (email) {
        existingEmails.add(email);
      }
    });

    // --------------------------------------------------------
    // 5. Validate uploaded rows
    // --------------------------------------------------------

    const validEmployees = [];
    const errors = [];

    const fileEmployeeIds = new Set();
    const fileEmails = new Set();

    employees.forEach((row, index) => {
      const rowNumber = index + 2;

      const employeeId =
        normalizeString(
          row.employeeId
        );

      const employeeName =
        normalizeString(
          row.employeeName
        );

      const employeeEmail =
        normalizeEmail(
          row.employeeEmail
        );

      const department =
        normalizeString(
          row.department
        );

      const designation =
        normalizeString(
          row.designation
        );

      const casualLeave =
        parseLeaveValue(
          row.casualLeave
        );

      const sickLeave =
        parseLeaveValue(
          row.sickLeave
        );

      const annualLeave =
        parseLeaveValue(
          row.annualLeave
        );

      const rowErrors = [];

      // ------------------------------------------------------
      // Required fields
      // ------------------------------------------------------

      if (!employeeId) {
        rowErrors.push(
          "Employee ID is required"
        );
      }

      if (!employeeName) {
        rowErrors.push(
          "Employee name is required"
        );
      }

      if (!employeeEmail) {
        rowErrors.push(
          "Employee email is required"
        );
      } else if (
        !isValidEmail(employeeEmail)
      ) {
        rowErrors.push(
          "Invalid email address"
        );
      }

      // ------------------------------------------------------
      // Leave validation
      // ------------------------------------------------------

      if (
        row.casualLeave !== "" &&
        casualLeave === null
      ) {
        rowErrors.push(
          "Casual Leave must be a non-negative number"
        );
      }

      if (
        row.sickLeave !== "" &&
        sickLeave === null
      ) {
        rowErrors.push(
          "Sick Leave must be a non-negative number"
        );
      }

      if (
        row.annualLeave !== "" &&
        annualLeave === null
      ) {
        rowErrors.push(
          "Annual Leave must be a non-negative number"
        );
      }

      // ------------------------------------------------------
      // Duplicate against existing database
      // ------------------------------------------------------

      if (
        existingEmployeeIds.has(
          employeeId.toLowerCase()
        )
      ) {
        rowErrors.push(
          `Employee ID already exists: ${employeeId}`
        );
      }

      if (
        existingEmails.has(employeeEmail)
      ) {
        rowErrors.push(
          `Employee email already exists: ${employeeEmail}`
        );
      }

      // ------------------------------------------------------
      // Duplicate inside uploaded file
      // ------------------------------------------------------

      const normalizedId =
        employeeId.toLowerCase();

      if (
        fileEmployeeIds.has(
          normalizedId
        )
      ) {
        rowErrors.push(
          `Duplicate Employee ID in uploaded file: ${employeeId}`
        );
      }

      if (
        fileEmails.has(
          employeeEmail
        )
      ) {
        rowErrors.push(
          `Duplicate email in uploaded file: ${employeeEmail}`
        );
      }

      // ------------------------------------------------------
      // If errors exist
      // ------------------------------------------------------

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          employeeId,
          employeeName,
          employeeEmail,
          errors: rowErrors,
        });

        return;
      }

      // ------------------------------------------------------
      // Mark as seen
      // ------------------------------------------------------

      fileEmployeeIds.add(
        normalizedId
      );

      fileEmails.add(
        employeeEmail
      );

      // ------------------------------------------------------
      // Valid employee
      // ------------------------------------------------------

      validEmployees.push({
        employeeId,
        employeeName,
        employeeEmail,
        department,
        designation,

        leaveBalance: {
          casual:
            casualLeave ?? 0,

          sick:
            sickLeave ?? 0,

          annual:
            annualLeave ?? 0,
        },

        status: "ACTIVE",
      });
    });

    // --------------------------------------------------------
    // 6. If no valid employees
    // --------------------------------------------------------

    if (validEmployees.length === 0) {
      return NextResponse.json({
        success: false,
        message:
          "No valid employees found to import.",
        importedCount: 0,
        failedCount: errors.length,
        errors,
      });
    }

    // --------------------------------------------------------
    // 7. Firestore batch writes
    //
    // Firestore batch limit is 500 operations.
    // We already limit upload to 500.
    // --------------------------------------------------------

    const batch =
      adminDb.batch();

    const createdEmployeeIds = [];

    validEmployees.forEach(
      (employee) => {
        const employeeRef =
          employeesRef.doc();

        batch.set(employeeRef, {
          employeeId:
            employee.employeeId,

          employeeName:
            employee.employeeName,

          employeeEmail:
            employee.employeeEmail,

          department:
            employee.department,

          designation:
            employee.designation,

          leaveBalance:
            employee.leaveBalance,

          status:
            employee.status,

          createdAt:
            FieldValue.serverTimestamp(),

          updatedAt:
            FieldValue.serverTimestamp(),
        });

        createdEmployeeIds.push(
          employeeRef.id
        );
      }
    );

    await batch.commit();

    // --------------------------------------------------------
    // 8. Return result
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        "Bulk employee import completed.",

      importedCount:
        validEmployees.length,

      failedCount:
        errors.length,

      totalRows:
        employees.length,

      errors,

      employeeIds:
        createdEmployeeIds,
    });
  } catch (error) {
    console.error(
      "Bulk employee import error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Failed to import employees.",
      },
      {
        status: 500,
      }
    );
  }
}