import { useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  CircularProgress,
  Typography,
} from "@mui/material";
import ApprovalTableRow from "./ApprovalTableRow";

export default function ApprovalsTable({
  requests,
  loading,
  processingId,
  onApprove,
  onReject,
}) {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated data
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Card Header */}
      <Box sx={{ p: 3, borderBottom: "1px solid #e5e7eb" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1f2937" }}>
          Leave Requests
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 13, color: "#6b7280" }}>
          Approve or reject leave requests from registered employees.
        </Typography>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#667eea" }} />
        </Box>
      ) : requests.length === 0 ? (
        /* Empty State */
        <Box
          sx={{
            py: 8,
            px: 3,
            textAlign: "center",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Typography sx={{ fontSize: 15, color: "#6b7280" }}>
            No leave requests found for registered employees.
          </Typography>
        </Box>
      ) : (
        /* Table with Pagination */
        <Box>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 1350 }}>
              <TableHead>
              <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, minWidth: "180px" }}>
                  EMPLOYEE
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "120px" }}>
                  LEAVE TYPE
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "130px" }}>
                  DATES
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "60px", textAlign: "center" }}>
                  DAYS
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "180px" }}>
                  LEAVE BALANCE
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "120px" }}>
                  REASON
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "120px" }}>
                  STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "150px" }}>
                  DEDUCTION
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: "200px", }}>
                  ACTION
                </TableCell>
              </TableRow>
            </TableHead>

              <TableBody>
                {paginatedRequests.map((request) => (
                  <ApprovalTableRow
                    key={request.id}
                    request={request}
                    isProcessing={processingId === request.id}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={requests.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              "& .MuiTablePagination-toolbar": {
                padding: "12px 16px",
              },
              "& .MuiTablePagination-selectLabel": {
                marginBottom: 0,
                fontSize: "13px",
                color: "#6b7280",
              },
              "& .MuiTablePagination-displayedRows": {
                marginBottom: 0,
                fontSize: "13px",
                color: "#6b7280",
              },
              "& .MuiTablePagination-select": {
                marginLeft: "8px",
                marginRight: "16px",
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}