"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import PeopleIcon from "@mui/icons-material/People";

// Import components
import Sidebar from "@/components/dashboard/Sidebar";
import EmployeeForm from "@/components/employees/EmployeeForm";
import CustomTable from "@/components/employees/CustomTable";
import BulkUploadDialog from "@/components/employees/BulkUploadDialog";
import PageHeader from "@/components/common/PageHeader";
import AlertBox from "@/components/common/AlertBox";

// Import hooks
import { useEmployees } from "@/hooks/useEmployees";
import { useBulkUpload } from "@/hooks/useBulkUpload";

export default function EmployeesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Employees hook
  const {
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
    setMessage,
    setError,
    setDeleteEmployee,
  } = useEmployees();

  // Bulk upload hook
  const {
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
  } = useBulkUpload(loadEmployees);

  useEffect(() => {
    loadEmployees();
  }, []);

  // Table columns
  const tableColumns = [
    { key: "employeeId", label: "ID", width: "120px" },
    { key: "employeeName", label: "Name" },
    { key: "employeeEmail", label: "Email" },
    { key: "department", label: "Department" },
    { key: "leaveBalance.casual", label: "Casual", type: "number", align: "center" },
    { key: "leaveBalance.sick", label: "Sick", type: "number", align: "center" },
    { key: "leaveBalance.annual", label: "Annual", type: "number", align: "center" },
    {
      key: "status",
      label: "Status",
      type: "status",
      statusMap: {
        ACTIVE: { color: "#065f46", bgColor: "#d1fae5" },
        INACTIVE: { color: "#7f1d1d", bgColor: "#fee2e2" },
      },
    },
  ];

  const bulkColumns = [
    { key: "employeeId", label: "ID" },
    { key: "employeeName", label: "Name" },
    { key: "employeeEmail", label: "Email" },
    { key: "department", label: "Department" },
  ];

  return (
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: "auto" }}>
        {/* Header */}
        <PageHeader
          icon={<PeopleIcon />}
          title="Team Members"
          subtitle="Manage your employee directory"
          actions={[
            {
              variant: "outlined",
              startIcon: <DownloadIcon />,
              label: isMobile ? "Template" : "Download Template",
              onClick: downloadTemplate,
            },
            {
              variant: "contained",
              startIcon: <UploadFileIcon />,
              label: isMobile ? "Upload" : "Bulk Upload",
              onClick: () => setBulkDialogOpen(true),
            },
          ]}
        />

        {/* Alerts */}
        <AlertBox message={message} error={error} onClose={() => setMessage("")} />

        {/* Add Employee Form */}
        <EmployeeForm
          form={form}
          onFormChange={handleFormChange}
          onSubmit={editingEmployee ? updateEmployee : addEmployee}
          loading={saving}
          error={error}
          onErrorClose={() => setError("")}
          submitButtonText={editingEmployee ? "Update Employee" : "Add Employee"}
          title={editingEmployee ? "Edit Employee" : "Add New Employee"}
          isEditing={Boolean(editingEmployee)}
        />

        {/* Employee Table */}
        <CustomTable
          columns={tableColumns}
          rows={employees}
          loading={loading}
          onEdit={editEmployee}
          onDelete={setDeleteEmployee}
          emptyMessage="No employees found. Add your first employee to get started."
          pagination={true}
          rowsPerPageDefault={10}
        />
      {/* Edit Dialog */}
      <Dialog
        open={Boolean(editingEmployee)}
        onClose={cancelEdit}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1a1a2e", borderBottom: "1px solid #e5e7eb" }}>
          Edit Employee
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 2 }}>
            <EmployeeForm
              form={form}
              onFormChange={handleFormChange}
              onSubmit={updateEmployee}
              loading={saving}
              error={error}
              onErrorClose={() => setError("")}
              submitButtonText="Update Employee"
              title=""
              isEditing={true}
              showIcon={false}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e5e7eb", gap: 1 }}>
          <Button onClick={cancelEdit} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={updateEmployee} disabled={saving}>
            {saving ? "Updating..." : "Update Employee"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteEmployee)}
        onClose={() => !deleting && setDeleteEmployee(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1a1a2e", borderBottom: "1px solid #e5e7eb" }}>
          Delete Employee
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          Are you sure you want to delete <strong>{deleteEmployee?.employeeName}</strong>?
          <div style={{ marginTop: "12px", color: "#6b7280", fontSize: "14px" }}>
            This action cannot be undone.
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e5e7eb", gap: 1 }}>
          <Button onClick={() => setDeleteEmployee(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={deleteEmployeeAction}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Employee"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={bulkDialogOpen}
        onClose={() => !bulkImporting && setBulkDialogOpen(false)}
        bulkFile={bulkFile}
        bulkEmployees={bulkEmployees}
        bulkErrors={bulkErrors}
        bulkProcessing={bulkProcessing}
        bulkImporting={bulkImporting}
        onFileChange={handleFileChange}
        onImport={handleImport}
        onDownloadTemplate={downloadTemplate}
        columns={bulkColumns}
      />
      </Box>
  );
}