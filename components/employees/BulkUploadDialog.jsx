import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Alert,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadIcon from "@mui/icons-material/Download";

/**
 * BulkUploadDialog Component
 *
 * Reusable dialog for bulk uploading data via Excel/CSV
 *
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Handle dialog close
 * @param {Object} props.bulkFile - Selected file object
 * @param {Array} props.bulkEmployees - Parsed employee data
 * @param {Array} props.bulkErrors - Validation errors
 * @param {boolean} props.bulkProcessing - File processing state
 * @param {boolean} props.bulkImporting - Import in progress
 * @param {Function} props.onFileChange - Handle file selection
 * @param {Function} props.onImport - Handle import action
 * @param {Function} props.onDownloadTemplate - Download template
 * @param {Array} props.columns - Column configuration for preview
 * @param {string} props.title - Dialog title
 * @param {string} props.emptyMessage - Empty state message
 */
export default function BulkUploadDialog({
  open = false,
  onClose = () => {},
  bulkFile = null,
  bulkEmployees = [],
  bulkErrors = [],
  bulkProcessing = false,
  bulkImporting = false,
  onFileChange = () => {},
  onImport = () => {},
  onDownloadTemplate = () => {},
  columns = [],
  title = "Bulk Upload Employees",
  emptyMessage = "No employees to upload",
}) {
  const validCount = Math.max(
    bulkEmployees.length -
      bulkErrors.length,
    0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#1a1a2e",
          padding: "24px",
          borderBottom:
            "1px solid #e5e7eb",
        }}
      >
        {title}
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent
        sx={{
          padding: "24px",
          color: "#6b7280",
        }}
      >
        {/* ========================================== */}
        {/* File Upload Area */}
        {/* ========================================== */}

        <Box
          sx={{
            border: "2px dashed",
            borderColor:
              bulkFile
                ? "#667eea"
                : "#e5e7eb",
            borderRadius: "12px",
            p: 4,
            textAlign: "center",
            mt: 1,
            transition:
              "all 0.3s ease",
            backgroundColor:
              bulkFile
                ? "#f0f0ff"
                : "#f9fafb",
          }}
        >
          <UploadFileIcon
            sx={{
              fontSize: 48,
              color:
                bulkFile
                  ? "#667eea"
                  : "#9ca3af",
              mb: 1,
              transition:
                "all 0.3s ease",
            }}
          />

          <Typography
            variant="h6"
            sx={{ mb: 1, color: "#1a1a2e" }}
          >
            Upload Employee File
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Supported formats: Excel
            (.xlsx, .xls) and CSV
          </Typography>

          <Button
            variant="outlined"
            component="label"
            disabled={
              bulkProcessing
            }
            sx={{
              borderColor:
                "#667eea",
              color: "#667eea",

              "&:hover": {
                borderColor:
                  "#667eea",
                backgroundColor:
                  "#f0f0ff",
              },
            }}
          >
            Choose File

            <input
              hidden
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileChange}
            />
          </Button>

          {bulkFile && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`Selected: ${bulkFile.name}`}
                color="success"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {/* ========================================== */}
        {/* Format Information */}
        {/* ========================================== */}

        <Alert
          severity="info"
          sx={{
            mt: 3,
            borderRadius: "12px",
            backgroundColor:
              "#eff6ff",
            borderColor: "#3b82f6",
            color: "#082f49",
          }}
        >
          <Typography
            variant="body2"
            sx={{ mb: 1, fontWeight: 600 }}
          >
            Required Columns:
          </Typography>

          <Typography
            variant="body2"
            component="div"
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 1,
              mt: 1,
            }}
          >
            {[
              "employeeId",
              "employeeName",
              "employeeEmail",
              "department",
              "designation",
              "casualLeave",
              "sickLeave",
              "annualLeave",
            ].map((col) => (
              <Box
                key={col}
                sx={{
                  bg: "rgba(59, 130, 246, 0.1)",
                  p: 1,
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily:
                    "monospace",
                  backgroundColor:
                    "rgba(59, 130, 246, 0.1)",
                }}
              >
                {col}
              </Box>
            ))}
          </Typography>
        </Alert>

        {/* ========================================== */}
        {/* Processing State */}
        {/* ========================================== */}

        {bulkProcessing && (
          <Alert
            severity="info"
            sx={{
              mt: 3,
              borderRadius: "12px",
              backgroundColor:
                "#eff6ff",
              borderColor: "#3b82f6",
              display: "flex",
              alignItems:
                "center",
              gap: 1.5,
            }}
          >
            <CircularProgress
              size={20}
              sx={{
                color: "#3b82f6",
              }}
            />
            <Typography
              variant="body2"
            >
              Reading and validating file...
            </Typography>
          </Alert>
        )}

        {/* ========================================== */}
        {/* Preview Table */}
        {/* ========================================== */}

        {bulkEmployees.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                mb: 2,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: "#1a1a2e",
                }}
              >
                Preview
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                }}
              >
                <Chip
                  icon={
                    <CheckCircleIcon />
                  }
                  label={`${validCount} valid`}
                  color="success"
                  size="small"
                />

                {bulkErrors.length >
                  0 && (
                    <Chip
                      icon={
                        <ErrorIcon />
                      }
                      label={`${bulkErrors.length} errors`}
                      color="error"
                      size="small"
                    />
                  )}
              </Box>
            </Box>

            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 400,
                overflow: "auto",
                borderRadius: "12px",
                border:
                  "1px solid #e5e7eb",
              }}
            >
              <Table
                size="small"
                stickyHeader
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor:
                        "#f9fafb",
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight:
                          700,
                      }}
                    >
                      Row
                    </TableCell>

                    {columns.map(
                      (col) => (
                        <TableCell
                          key={
                            col.key
                          }
                          sx={{
                            fontWeight:
                              700,
                          }}
                        >
                          {
                            col.label
                          }
                        </TableCell>
                      )
                    )}

                    <TableCell
                      sx={{
                        fontWeight:
                          700,
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {bulkEmployees.map(
                    (employee, idx) => {
                      const rowNum =
                        idx + 2;

                      const rowError =
                        bulkErrors.find(
                          (err) =>
                            err.row ===
                            rowNum
                        );

                      return (
                        <TableRow
                          key={
                            idx
                          }
                          sx={{
                            backgroundColor:
                              rowError
                                ? "#fef2f2"
                                : "inherit",
                          }}
                        >
                          <TableCell>
                            {rowNum}
                          </TableCell>

                          {columns.map(
                            (col) => (
                              <TableCell
                                key={
                                  col.key
                                }
                              >
                                {
                                  employee[
                                  col.key
                                  ] ||
                                  "-"
                                }
                              </TableCell>
                            )
                          )}

                          <TableCell>
                            {rowError ? (
                              <Tooltip
                                title={rowError.errors.join(
                                  ", "
                                )}
                              >
                                <Chip
                                  icon={
                                    <ErrorIcon />
                                  }
                                  label="Error"
                                  color="error"
                                  size="small"
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                icon={
                                  <CheckCircleIcon />
                                }
                                label="Valid"
                                color="success"
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ========================================== */}
        {/* Error Details */}
        {/* ========================================== */}

        {bulkErrors.length > 0 && (
          <Alert
            severity="warning"
            sx={{
              mt: 3,
              borderRadius: "12px",
              backgroundColor:
                "#fefce8",
              borderColor:
                "#f59e0b",
              color: "#92400e",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                fontWeight: 600,
              }}
            >
              Rows with Errors:
            </Typography>

            {bulkErrors.map((err) => (
              <Typography
                key={err.row}
                variant="body2"
                sx={{ mb: 0.5 }}
              >
                <strong>
                  Row {err.row}:
                </strong>{" "}
                {err.errors.join(", ")}
              </Typography>
            ))}
          </Alert>
        )}

        {/* ========================================== */}
        {/* Template Download */}
        {/* ========================================== */}

        <Button
          variant="text"
          startIcon={<DownloadIcon />}
          onClick={
            onDownloadTemplate
          }
          sx={{
            mt: 2,
            color: "#667eea",

            "&:hover": {
              backgroundColor:
                "rgba(102, 126, 234, 0.1)",
            },
          }}
        >
          Download Sample Excel
          Template
        </Button>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions
        sx={{
          padding: "16px 24px",
          borderTop:
            "1px solid #e5e7eb",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={bulkImporting}
          sx={{
            color: "#667eea",

            "&:hover": {
              backgroundColor:
                "rgba(102, 126, 234, 0.1)",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={onImport}
          disabled={
            bulkImporting ||
            bulkProcessing ||
            bulkEmployees.length ===
              0 ||
            bulkErrors.length ===
              bulkEmployees.length
          }
          sx={{
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          {bulkImporting
            ? "Importing..."
            : `Import ${validCount} Employees`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ========================================================================
// Example Usage:
// ========================================================================

/*
const columns = [
  { key: "employeeId", label: "ID" },
  { key: "employeeName", label: "Name" },
  { key: "employeeEmail", label: "Email" },
  { key: "department", label: "Department" },
];

<BulkUploadDialog
  open={bulkDialogOpen}
  onClose={() => setBulkDialogOpen(false)}
  bulkFile={bulkFile}
  bulkEmployees={bulkEmployees}
  bulkErrors={bulkErrors}
  bulkProcessing={bulkProcessing}
  bulkImporting={bulkImporting}
  onFileChange={handleBulkFileChange}
  onImport={handleBulkImport}
  onDownloadTemplate={handleDownloadTemplate}
  columns={columns}
  title="Bulk Upload Employees"
/>
*/