"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/authClient";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import PageHeader from "@/components/common/PageHeader";

const initialEdit = {
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
};

export default function ApprovalsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [editData, setEditData] = useState(initialEdit);
    const [editOpen, setEditOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    async function loadRequests() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/dashboard/approvals", {
                headers: await getAuthHeaders(),
                cache: "no-store",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to load requests");
            }

            setRequests(Array.isArray(result.data) ? result.data : []);
        } catch (error) {
            setError(error.message || "Failed to load requests");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRequests();

        const sync = () => loadRequests();
        window.addEventListener("gmail-sync-complete", sync);

        return () => window.removeEventListener("gmail-sync-complete", sync);
    }, []);

    async function requestAction(id, action, body) {
        try {
            setProcessingId(id);
            setError("");

            const response = await fetch(`/api/approvals/${id}/${action}`, {
                method:
                    action === "delete" ? "DELETE" : action === "approve" || action === "reject" ? "POST" : "PUT",
                headers: {
                    ...(await getAuthHeaders()),
                    "Content-Type": "application/json",
                },
                ...(body && { body: JSON.stringify(body) }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || `Failed to ${action} request`
                );
            }

            return result;
        } catch (error) {
            setError(error.message || `Failed to ${action} request`);
            return null;
        } finally {
            setProcessingId(null);
        }
    }

    async function handleApprove(id) {
        if (await requestAction(id, "approve")) await loadRequests();
    }

    async function handleReject() {
        if (!selected || !rejectionReason.trim()) {
            setError("Please provide a reason for rejecting the leave.");
            return;
        }

        if (rejectionReason.trim().length > 500) {
            setError("Rejection reason cannot exceed 500 characters.");
            return;
        }

        const result = await requestAction(selected.id, "reject", {
            rejectionReason: rejectionReason.trim(),
        });

        if (result) {
            setRejectOpen(false);
            setSelected(null);
            setRejectionReason("");
            await loadRequests();
        }
    }

    async function handleEdit() {
        if (!selected) return;

        if (
            !editData.leaveType ||
            !editData.startDate ||
            !editData.endDate
        ) {
            setError("Leave type and dates are required.");
            return;
        }

        const result = await requestAction(
            selected.id,
            "edit",
            editData
        );

        if (result) {
            setEditOpen(false);
            setSelected(null);
            await loadRequests();
        }
    }

    async function handleDelete() {
        if (!selected) return;

        const result = await requestAction(selected.id, "delete");

        if (result) {
            setDeleteOpen(false);
            setSelected(null);
            await loadRequests();
        }
    }

    function openEdit(request) {
        setError("");
        setSelected(request);
        setEditData({
            leaveType: request.leaveType || "",
            startDate: request.startDate || "",
            endDate: request.endDate || "",
            reason: request.reason || "",
        });
        setEditOpen(true);
    }

    function openReject(request) {
        setError("");
        setSelected(request);
        setRejectionReason("");
        setRejectOpen(true);
    }

    function openDelete(request) {
        setError("");
        setSelected(request);
        setDeleteOpen(true);
    }

    function statusChip(status) {
        const config = {
            APPROVED: {
                label: "Approved",
                color: "success",
                icon: <CheckCircleIcon />,
            },
            REJECTED: {
                label: "Rejected",
                color: "error",
                icon: <CancelOutlinedIcon />,
            },
            PENDING: {
                label: "Pending",
                color: "warning",
                icon: <PendingActionsOutlinedIcon />,
            },
        };

        const item = config[status] || config.PENDING;

        return (
            <Chip
                size="small"
                label={item.label}
                color={item.color}
                icon={item.icon}
            />
        );
    }

    function balance(request) {
        const available = request.availableLeaveBalance ?? 0;
        const requested =
            request.requestedLeaveDays ?? request.numberOfDays ?? 0;

        if (request.balanceAvailable === false ||
            request.balanceStatus === "INSUFFICIENT") {
            return (
                <Box>
                    <Chip
                        size="small"
                        color="error"
                        icon={<WarningAmberOutlinedIcon />}
                        label="Insufficient"
                    />
                    <Typography fontSize={12} mt={0.5}>
                        Available: <b>{available}</b> · Requested: <b>{requested}</b>
                    </Typography>
                </Box>
            );
        }

        if (request.balanceAvailable === true ||
            request.balanceStatus === "SUFFICIENT") {
            return (
                <Box>
                    <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        label="Sufficient"
                    />
                    <Typography fontSize={12} mt={0.5}>
                        Available: <b>{available}</b> · Requested: {requested}
                    </Typography>
                </Box>
            );
        }

        return <Chip size="small" variant="outlined" label="Not available" />;
    }

    function deduction(request) {
        if (request.balanceDeducted) {
            return (
                <Box>
                    <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        label={`${request.deductedDays || 0} day(s) deducted`}
                    />
                    <Typography fontSize={12} color="#6b7280">
                        Remaining: {request.remainingLeaveBalance ?? 0}
                    </Typography>
                </Box>
            );
        }

        return (
            <Chip
                size="small"
                variant="outlined"
                color={request.status === "REJECTED" ? "error" : "default"}
                label={request.status === "REJECTED" ? "Not deducted" : "Awaiting approval"}
            />
        );
    }

    const busy = Boolean(processingId);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minWidth: 0 }}>

            <PageHeader
                icon={<ApprovalOutlinedIcon />}
                title="Leave Approvals"
                subtitle="Review and manage employee leave requests"
                showGmailSync
                onGmailSyncComplete={loadRequests}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}

            <Paper
                elevation={0}
                sx={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow:
            "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.05)",
                }}
            >
                {loading ? (
                    <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                        <CircularProgress sx={{ color: "#674D9F" }} />
                    </Box>
                ) : !requests.length ? (
                    <Box sx={{ py: 8, textAlign: "center", borderTop: "1px solid #e5e7eb" }}>
                        <Typography fontSize={15} color="#6b7280">
                            No leave requests found for registered employees.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer sx={{ overflowX: "auto" }}>
                        <Table sx={{ minWidth: 1350 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                                    {[
                                        "Employee",
                                        "Leave Type",
                                        "Dates",
                                        "Days",
                                        "Leave Balance",
                                        "Reason",
                                        "Status",
                                        "Deduction",
                                        "Action",
                                    ].map((item) => (
                                        <TableCell
                                            key={item}
                                            align={item === "Action" ? "right" : "left"}
                                        >
                                            {item}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {requests.map((request) => {
                                    const isPending = request.status === "PENDING";
                                    const processing = processingId === request.id;

                                    return (
                                        <TableRow key={request.id} hover>
                                            <TableCell>
                                                <Typography fontSize={14} fontWeight={600}>
                                                    {request.employeeName || "-"}
                                                </Typography>
                                                <Typography fontSize={12} color="#6b7280">
                                                    {request.employeeEmail || "-"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ textTransform: "capitalize" }}>
                                                {request.leaveType || "-"}
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={13}>
                                                    {request.startDate || "-"}
                                                </Typography>
                                                <Typography fontSize={13} color="#6b7280">
                                                    to {request.endDate || "-"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography fontWeight={600}>
                                                    {request.numberOfDays || 0}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>{balance(request)}</TableCell>

                                            <TableCell sx={{ maxWidth: 250 }}>
                                                <Typography
                                                    fontSize={13}
                                                    title={request.reason || ""}
                                                    sx={{
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {request.reason || "-"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                {statusChip(request.status)}
                                            </TableCell>

                                            <TableCell>{deduction(request)}</TableCell>

                                            <TableCell align="right">
                                                {isPending ? (
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "flex-end",
                                                            gap: 0.75,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<EditOutlinedIcon />}
                                                            disabled={processing}
                                                            onClick={() => openEdit(request)}
                                                            sx={{
                                                                textTransform: "none",
                                                                color: "#674D9F",
                                                                borderColor: "#674D9F",
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<DeleteOutlinedIcon />}
                                                            disabled={processing}
                                                            onClick={() => openDelete(request)}
                                                            sx={{
                                                                textTransform: "none",
                                                                color: "#d32f2f",
                                                                borderColor: "#d32f2f",
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            disabled={processing}
                                                            onClick={() => handleApprove(request.id)}
                                                            sx={{
                                                                textTransform: "none",
                                                                backgroundColor: "#2e7d32",
                                                                "&:hover": {
                                                                    backgroundColor: "#1b5e20",
                                                                },
                                                            }}
                                                        >
                                                            {processing ? (
                                                                <CircularProgress size={18} color="inherit" />
                                                            ) : (
                                                                "Approve"
                                                            )}
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={processing}
                                                            onClick={() => openReject(request)}
                                                            sx={{
                                                                textTransform: "none",
                                                                color: "#d32f2f",
                                                                borderColor: "#d32f2f",
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <Typography fontSize={12} color="#9ca3af">
                                                        Completed
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog
                open={editOpen}
                onClose={() => !busy && setEditOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Edit Leave Request
                </DialogTitle>

                <DialogContent>
                    {selected && (
                        <Box sx={{ pt: 1 }}>
                            <Typography fontWeight={600}>
                                {selected.employeeName}
                            </Typography>
                            <Typography fontSize={13} color="#6b7280" mb={2}>
                                {selected.employeeEmail}
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                label="Leave Type"
                                value={editData.leaveType}
                                onChange={(e) =>
                                    setEditData({
                                        ...editData,
                                        leaveType: e.target.value,
                                    })
                                }
                                margin="normal"
                            >
                                <MenuItem value="casual">Casual</MenuItem>
                                <MenuItem value="sick">Sick</MenuItem>
                                <MenuItem value="annual">Annual</MenuItem>
                            </TextField>

                            <Box sx={{ display: "flex", gap: 2 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Start Date"
                                    value={editData.startDate}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            startDate: e.target.value,
                                        })
                                    }
                                    margin="normal"
                                />

                                <TextField
                                    fullWidth
                                    type="date"
                                    label="End Date"
                                    value={editData.endDate}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            endDate: e.target.value,
                                        })
                                    }
                                    margin="normal"
                                />
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Reason"
                                value={editData.reason}
                                onChange={(e) =>
                                    setEditData({
                                        ...editData,
                                        reason: e.target.value,
                                    })
                                }
                                margin="normal"
                            />
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setEditOpen(false)}
                        disabled={busy}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleEdit}
                        disabled={busy}
                        sx={{
                            textTransform: "none",
                            backgroundColor: "#674D9F",
                        }}
                    >
                        {busy ? <CircularProgress size={18} color="inherit" /> : "Save Changes"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={rejectOpen}
                onClose={() => !busy && setRejectOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Reject Leave Request
                </DialogTitle>

                <DialogContent>
                    {selected && (
                        <Typography mb={2}>
                            Reject leave request for <b>{selected.employeeName}</b>?
                        </Typography>
                    )}

                    <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Reason for rejection"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        helperText={`${rejectionReason.length}/500`}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setRejectOpen(false)}
                        disabled={busy}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleReject}
                        disabled={!rejectionReason.trim() || busy}
                        sx={{
                            textTransform: "none",
                            backgroundColor: "#d32f2f",
                        }}
                    >
                        {busy ? <CircularProgress size={18} color="inherit" /> : "Reject Leave"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteOpen}
                onClose={() => !busy && setDeleteOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Delete Leave Request?
                </DialogTitle>

                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the leave request for{" "}
                        <b>{selected?.employeeName}</b>?
                    </Typography>
                    <Typography mt={1} fontSize={13} color="#6b7280">
                        This action cannot be undone.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        onClick={() => setDeleteOpen(false)}
                        disabled={busy}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={busy}
                        sx={{ textTransform: "none" }}
                    >
                        {busy ? <CircularProgress size={18} color="inherit" /> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}