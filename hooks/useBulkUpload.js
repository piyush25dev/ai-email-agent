import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { getAuthHeaders } from "@/lib/authClient";

const requiredColumns = [
  "employeeId",
  "employeeName",
  "employeeEmail",
  "department",
  "designation",
  "casualLeave",
  "sickLeave",
  "annualLeave",
];

/**
 * Hook for managing bulk upload operations
 */
export function useBulkUpload(onLoadEmployees) {
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkEmployees, setBulkEmployees] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkError, setBulkError] = useState("");

  // Parse and validate file
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkEmployees([]);
    setBulkErrors([]);
    setBulkMessage("");
    setBulkError("");

    try {
      setBulkProcessing(true);
      const fileName = file.name.toLowerCase();

      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls") && !fileName.endsWith(".csv")) {
        throw new Error("Please upload an Excel (.xlsx/.xls) or CSV file.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames.length) {
        throw new Error("The uploaded file does not contain a worksheet.");
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });

      if (!rows.length) {
        throw new Error("The uploaded file is empty.");
      }

      // Validate columns
      const columns = Object.keys(rows[0]);
      const missingColumns = requiredColumns.filter((col) => !columns.includes(col));

      if (missingColumns.length) {
        throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
      }

      // Normalize rows
      const normalizedRows = rows.map((row, index) => ({
        _rowNumber: index + 2,
        employeeId: String(row.employeeId ?? "").trim(),
        employeeName: String(row.employeeName ?? "").trim(),
        employeeEmail: String(row.employeeEmail ?? "").trim().toLowerCase(),
        department: String(row.department ?? "").trim(),
        designation: String(row.designation ?? "").trim(),
        casualLeave: row.casualLeave === "" ? 0 : Number(row.casualLeave),
        sickLeave: row.sickLeave === "" ? 0 : Number(row.sickLeave),
        annualLeave: row.annualLeave === "" ? 0 : Number(row.annualLeave),
      }));

      // Validate data
      const errors = [];
      normalizedRows.forEach((employee, index) => {
        const rowNumber = index + 2;
        const rowErrors = [];

        if (!employee.employeeId) rowErrors.push("Employee ID is required");
        if (!employee.employeeName) rowErrors.push("Employee name is required");

        if (!employee.employeeEmail) {
          rowErrors.push("Employee email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.employeeEmail)) {
          rowErrors.push("Invalid email");
        }

        if (!Number.isFinite(employee.casualLeave) || employee.casualLeave < 0) {
          rowErrors.push("Invalid casual leave");
        }
        if (!Number.isFinite(employee.sickLeave) || employee.sickLeave < 0) {
          rowErrors.push("Invalid sick leave");
        }
        if (!Number.isFinite(employee.annualLeave) || employee.annualLeave < 0) {
          rowErrors.push("Invalid annual leave");
        }

        if (rowErrors.length) {
          errors.push({ row: rowNumber, employeeId: employee.employeeId, errors: rowErrors });
        }
      });

      setBulkEmployees(normalizedRows);
      setBulkErrors(errors);
    } catch (error) {
      setBulkEmployees([]);
      setBulkErrors([]);
      setBulkError(error.message || "Failed to read the file.");
    } finally {
      setBulkProcessing(false);
    }
  }, []);

  // Import employees
  const handleImport = useCallback(async () => {
    if (!bulkEmployees.length) {
      setBulkError("No employees available to import.");
      return;
    }

    const invalidRows = new Set(bulkErrors.map((error) => error.row));
    const validRows = bulkEmployees.filter((_, index) => !invalidRows.has(index + 2));

    if (!validRows.length) {
      setBulkError("There are no valid employees to import.");
      return;
    }

    try {
      setBulkImporting(true);
      setBulkMessage("");
      setBulkError("");

      const headers = await getAuthHeaders();
      const response = await fetch("/api/employees/bulk", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ employees: validRows }),
      });

      const result = await response.json();

      if (!response.ok && !result.importedCount) {
        throw new Error(result.message || "Failed to import employees.");
      }

      if (result.failedCount > 0) {
        setBulkMessage(
          `${result.importedCount} employees imported. ${result.failedCount} rows failed.`
        );
        setBulkErrors(result.errors || []);
      } else {
        setBulkMessage(`${result.importedCount} employees imported successfully.`);
        setBulkDialogOpen(false);
        setBulkFile(null);
        setBulkEmployees([]);
        setBulkErrors([]);
      }

      await onLoadEmployees();
    } catch (error) {
      setBulkError(error.message || "Failed to import employees.");
    } finally {
      setBulkImporting(false);
    }
  }, [bulkEmployees, bulkErrors, onLoadEmployees]);

  // Download template
  const downloadTemplate = useCallback(() => {
    const template = [
      {
        employeeId: "EMP-001",
        employeeName: "Thor",
        employeeEmail: "thor@example.com",
        department: "Business Development",
        designation: "Business Analyst",
        casualLeave: 8,
        sickLeave: 5,
        annualLeave: 12,
      },
      {
        employeeId: "EMP-002",
        employeeName: "Bruce",
        employeeEmail: "bruce@example.com",
        department: "Engineering",
        designation: "Software Engineer",
        casualLeave: 8,
        sickLeave: 5,
        annualLeave: 12,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "employee_bulk_upload_template.xlsx");
  }, []);

  return {
    bulkDialogOpen,
    bulkFile,
    bulkEmployees,
    bulkErrors,
    bulkProcessing,
    bulkImporting,
    bulkMessage,
    bulkError,
    setBulkDialogOpen,
    handleFileChange,
    handleImport,
    downloadTemplate,
    setBulkMessage,
    setBulkError,
  };
}