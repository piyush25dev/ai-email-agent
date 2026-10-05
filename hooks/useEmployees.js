import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/lib/authClient";

const initialForm = {
  employeeId: "",
  employeeName: "",
  employeeEmail: "",
  department: "",
  designation: "",
  casualLeave: 8,
  sickLeave: 5,
  annualLeave: 12,
};

/**
 * Hook for managing employee data and CRUD operations
 */
export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);

  // Load employees
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const headers = await getAuthHeaders();
      const response = await fetch("/api/employees", {
        method: "GET",
        headers,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load employees");
      }
      setEmployees(result.data || []);
    } catch (error) {
      console.error("Load employees error:", error);
      setError(error.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add employee
  const addEmployee = useCallback(async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.employeeId.trim() || !form.employeeName.trim() || !form.employeeEmail.trim()) {
        setError("Employee ID, name and email are required.");
        return;
      }

      const headers = await getAuthHeaders();
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create employee");
      }

      setMessage("Employee created successfully.");
      setForm(initialForm);
      await loadEmployees();
    } catch (error) {
      setError(error.message || "Failed to create employee");
    } finally {
      setSaving(false);
    }
  }, [form, loadEmployees]);

  // Edit employee
  const editEmployee = useCallback((employee) => {
    setMessage("");
    setError("");
    setEditingEmployee(employee);
    setForm({
      employeeId: employee.employeeId || "",
      employeeName: employee.employeeName || "",
      employeeEmail: employee.employeeEmail || "",
      department: employee.department || "",
      designation: employee.designation || "",
      casualLeave: employee.leaveBalance?.casual ?? 0,
      sickLeave: employee.leaveBalance?.sick ?? 0,
      annualLeave: employee.leaveBalance?.annual ?? 0,
    });
  }, []);

  // Update employee
  const updateEmployee = useCallback(async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!form.employeeId.trim() || !form.employeeName.trim() || !form.employeeEmail.trim()) {
        setError("Employee ID, name and email are required.");
        return;
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update employee");
      }

      setMessage("Employee updated successfully.");
      setEditingEmployee(null);
      setForm(initialForm);
      await loadEmployees();
    } catch (error) {
      setError(error.message || "Failed to update employee");
    } finally {
      setSaving(false);
    }
  }, [form, editingEmployee, loadEmployees]);

  // Delete employee
  const deleteEmployeeAction = useCallback(async () => {
    if (!deleteEmployee) return;

    try {
      setDeleting(true);
      setMessage("");
      setError("");

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/employees/${deleteEmployee.id}`, {
        method: "DELETE",
        headers,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete employee");
      }

      setMessage("Employee deleted successfully.");
      setDeleteEmployee(null);
      await loadEmployees();
    } catch (error) {
      setError(error.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  }, [deleteEmployee, loadEmployees]);

  // Cancel edit
  const cancelEdit = useCallback(() => {
    setEditingEmployee(null);
    setForm(initialForm);
    setError("");
  }, []);

  const handleFormChange = useCallback(({ name, value }) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  return {
    employees,
    loading,
    saving,
    deleting,
    message,
    error,
    form,
    editingEmployee,
    deleteEmployee,
    loadEmployees,
    addEmployee,
    editEmployee,
    updateEmployee,
    deleteEmployeeAction,
    cancelEdit,
    handleFormChange,
    setForm,
    setMessage,
    setError,
    setEditingEmployee,
    setDeleteEmployee,
  };
}