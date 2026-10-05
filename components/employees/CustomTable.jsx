import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Chip,
  TablePagination,
  CircularProgress,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";

export default function CustomTable({
  columns = [],
  rows = [],
  loading = false,
  onEdit = null,
  onDelete = null,
  showActions = true,
  emptyMessage = "No data found",
  pagination = true,
  rowsPerPageDefault = 10,
  striped = false,
  renderCustomCell = null,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageDefault);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(
      parseInt(event.target.value, 10)
    );
    setPage(0);
  };

  // Calculate pagination
  const displayRows = pagination
    ? rows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    )
    : rows;

  // Render cell content
  const renderCell = (row, column) => {
    if (
      renderCustomCell &&
      column.render
    ) {
      return column.render(row, column);
    }

    const value =
      column.key
        .split(".")
        .reduce(
          (obj, key) =>
            obj?.[key],
          row
        ) || "-";

    // Handle different data types
    if (
      column.type === "status"
    ) {
      const statusMap = column.statusMap || {};
      const statusConfig =
        statusMap[value] || {};

      return (
        <Chip
          label={value}
          size="small"
          color={
            statusConfig.color ||
            "default"
          }
          sx={{
            backgroundColor:
              statusConfig.bgColor,
            color: statusConfig.color,
            fontWeight: 600,
          }}
        />
      );
    }

    if (
      column.type === "badge"
    ) {
      return (
        <Chip
          label={value}
          size="small"
          variant="outlined"
        />
      );
    }

    if (
      column.type === "number"
    ) {
      return (
        <Typography
          sx={{ fontWeight: 500 }}
        >
          {typeof value === "number"
            ? value.toFixed(
              column.precision || 0
            )
            : value}
        </Typography>
      );
    }

    if (
      column.type === "array"
    ) {
      return (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {Array.isArray(value) &&
            value.map(
              (item, idx) => (
                <Chip
                  key={idx}
                  label={item}
                  size="small"
                  variant="outlined"
                />
              )
            )}
        </Box>
      );
    }

    return (
      <Typography>
        {value}
      </Typography>
    );
  };

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          overflow: "auto",
          boxShadow:
            "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth:
              columns.length >
                6
                ? "900px"
                : "100%",
          }}
        >
          {/* Header */}
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={
                    column.align ||
                    "left"
                  }
                  sx={{
                    width:
                      column.width,
                    minWidth:
                      column.minWidth ||
                      "120px",
                    maxWidth:
                      column.maxWidth,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}

              {showActions && (
                onEdit ||
                onDelete
              ) && (
                  <TableCell
                    align="center"
                    sx={{
                      minWidth:
                        "100px",
                    }}
                  >
                    Actions
                  </TableCell>
                )}
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (showActions ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 4 }}
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : displayRows.length >
              0 ? (
              displayRows.map(
                (row, rowIndex) => (
                  <TableRow
                    key={
                      row.id ||
                      rowIndex
                    }
                    sx={{
                      backgroundColor:
                        striped &&
                          rowIndex % 2 ===
                          1
                          ? "#f9fafb"
                          : "inherit",
                    }}
                  >
                    {columns.map(
                      (column) => (
                        <TableCell
                          key={
                            column.key
                          }
                          align={
                            column.align ||
                            "left"
                          }
                        >
                          {renderCell(
                            row,
                            column
                          )}
                        </TableCell>
                      )
                    )}

                    {showActions &&
                      (onEdit ||
                        onDelete) && (
                        <TableCell
                          align="center"
                        >
                          <Box
                            sx={{
                              display:
                                "flex",
                              gap: 0.5,
                              justifyContent:
                                "center",
                            }}
                          >
                            {onEdit && (
                              <Tooltip
                                title="Edit"
                              >
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() =>
                                    onEdit(
                                      row
                                    )
                                  }
                                >
                                  <EditIcon
                                    fontSize="small"
                                  />
                                </IconButton>
                              </Tooltip>
                            )}

                            {onDelete && (
                              <Tooltip
                                title="Delete"
                              >
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    onDelete(
                                      row
                                    )
                                  }
                                >
                                  <DeleteIcon
                                    fontSize="small"
                                  />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                  </TableRow>
                )
              )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (showActions ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Box
                    sx={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      alignItems:
                        "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#6b7280",
                        fontWeight:
                          500,
                      }}
                    >
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination &&
        rows.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[
              5, 10, 25, 50,
            ]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={
              handleChangePage
            }
            onRowsPerPageChange={
              handleChangeRowsPerPage
            }
            sx={{
              borderTop:
                "1px solid #e5e7eb",
              mt: 2,
            }}
          />
        )}
    </>
  );
}

// ========================================================================
// Example Usage:
// ========================================================================

/*
const columns = [
  { key: "employeeId", label: "ID", width: "120px" },
  { key: "employeeName", label: "Name" },
  { key: "employeeEmail", label: "Email" },
  { key: "department", label: "Department" },
  { 
    key: "leaveBalance.casual", 
    label: "Casual Leave", 
    type: "number",
    align: "center"
  },
  { 
    key: "status", 
    label: "Status", 
    type: "status",
    statusMap: {
      ACTIVE: { color: "#065f46", bgColor: "#d1fae5" },
      INACTIVE: { color: "#7f1d1d", bgColor: "#fee2e2" },
    }
  },
];

<CustomTable
  columns={columns}
  rows={employees}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  pagination={true}
  rowsPerPageDefault={10}
  emptyMessage="No employees found"
/>
*/