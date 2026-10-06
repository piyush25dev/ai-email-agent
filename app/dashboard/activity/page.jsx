"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getAuthHeaders } from "@/lib/authClient";
import {
    Box,
    Chip,
    CircularProgress,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Stack,
    Typography,
} from "@mui/material";

import {
    CheckCircle,
    Error,
    Email,
    Psychology,
    RequestQuote,
    Send,
    SupervisorAccount,
} from "@mui/icons-material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

import { auth } from "@/lib/firebase";
import PageHeader from "@/components/common/PageHeader";

const ACTIVITY_FETCH_LIMIT = 100;
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_ROWS_PER_PAGE = 10;

function getActivityIcon(type) {
    switch (type) {
        case "EMAIL_RECEIVED":
            return <Email fontSize="small" />;

        case "AI_ANALYZED":
            return <Psychology fontSize="small" />;

        case "LEAVE_REQUEST_CREATED":
            return <RequestQuote fontSize="small" />;

        case "MANAGER_NOTIFIED":
            return <SupervisorAccount fontSize="small" />;

        case "APPROVED":
            return <CheckCircle fontSize="small" />;

        case "REJECTED":
            return <Error fontSize="small" />;

        case "LEAVE_NOTIFICATION_SENT":
            return <Send fontSize="small" />;

        default:
            return <Email fontSize="small" />;
    }
}

function getActivityColor(type) {
    switch (type) {
        case "APPROVED":
            return "success";

        case "REJECTED":
            return "error";

        case "AI_ANALYZED":
            return "info";

        case "MANAGER_NOTIFIED":
            return "warning";

        case "LEAVE_REQUEST_CREATED":
            return "secondary";

        case "LEAVE_NOTIFICATION_SENT":
            return "success";

        default:
            return "default";
    }
}

function getActivityLabel(type) {
    const labels = {
        EMAIL_RECEIVED: "Email Received",
        AI_ANALYZED: "AI Analysis",
        LEAVE_REQUEST_CREATED: "Leave Request Created",
        MANAGER_NOTIFIED: "Manager Notified",
        APPROVED: "Leave Approved",
        REJECTED: "Leave Rejected",
        LEAVE_NOTIFICATION_SENT: "Employee Notified",
    };

    return (
        labels[type] ||
        type
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
}

function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ActivityPage() {
    const [activities, setActivities] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

    const listTopRef = useRef(null);

    // Get currently logged-in Firebase user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
                setActivities([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    async function fetchActivities() {
        if (!userId) return;

        try {
            setLoading(true);
            setError("");

            const headers = await getAuthHeaders();

            const response = await fetch(
                `/api/dashboard/activity?limit=${ACTIVITY_FETCH_LIMIT}`,
                {
                    cache: "no-store",
                    headers,
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load activity"
                );
            }

            setActivities(result.data || []);
            setPage(1);
        } catch (error) {
            console.error("Failed to load activities:", error);
            setError(error.message || "Failed to load activity");
        } finally {
            setLoading(false);
        }
    }

    // Fetch activity whenever Firebase user is available
    useEffect(() => {
        if (!userId) return;

        fetchActivities();
    }, [userId]);

    // Derived pagination values
    const totalItems = activities.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

    // Clamp in case rowsPerPage / data changed while on a later page
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

    const paginatedActivities = activities.slice(startIndex, endIndex);

    function scrollToListTop() {
        listTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    function handlePageChange(event, newPage) {
        setPage(newPage);
        scrollToListTop();
    }

    function handleRowsPerPageChange(event) {
        setRowsPerPage(Number(event.target.value));
        setPage(1);
        scrollToListTop();
    }

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                p: { xs: 2, md: 4 },
                overflow: "hidden",
            }}
        >
            <PageHeader
            icon={<HistoryOutlinedIcon />}
                title="Activity"
                subtitle="Track everything performed by the AI Email Agent."
            />

            {loading ? (
                <Box
                    sx={{
                        minHeight: 400,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Paper
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        boxShadow:
            "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <Typography color="error">
                        {error}
                    </Typography>
                </Paper>
            ) : activities.length === 0 ? (
                <Paper
                    sx={{
                        p: 5,
                        borderRadius: 3,
                        textAlign: "center",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{ mb: 1 }}
                    >
                        No activity yet
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        AI Email Agent activity will appear here.
                    </Typography>
                </Paper>
            ) : (
                <Paper
                    ref={listTopRef}
                    sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        scrollMarginTop: 16,
                        boxShadow:
                            "0 0 0 1px rgba(0, 0, 0, 0.02), 0 0 12px rgba(0, 0, 0, 0.05), 0 0 32px rgba(0, 0, 0, 0.04)",
                    }}
                >
                    {paginatedActivities.map((activity, index) => (
                        <Box
                            key={activity.id}
                            sx={{
                                display: "flex",
                                gap: 2,
                                p: { xs: 2, md: 2.5 },
                                borderBottom:
                                    index !== paginatedActivities.length - 1
                                        ? "1px solid #eeeeee"
                                        : "none",
                                transition: "background 0.2s",
                                "&:hover": {
                                    background: "#fafafa",
                                },
                            }}
                        >
                            {/* Icon */}
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    minWidth: 42,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#f0f0f5",
                                }}
                            >
                                {getActivityIcon(activity.type)}
                            </Box>

                            {/* Content */}
                            <Box
                                sx={{
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: {
                                            xs: "flex-start",
                                            sm: "center",
                                        },
                                        justifyContent: "space-between",
                                        gap: 2,
                                        flexWrap: "wrap",
                                        mb: 0.5,
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                        }}
                                    >
                                        {activity.message}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {formatDate(activity.createdAt)}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Chip
                                        label={getActivityLabel(activity.type)}
                                        color={getActivityColor(activity.type)}
                                        size="small"
                                        variant="outlined"
                                    />

                                    {activity.emailId && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: 300,
                                            }}
                                        >
                                            Email: {activity.emailId}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Metadata */}
                                {activity.metadata &&
                                    Object.keys(activity.metadata).length > 0 && (
                                        <Box
                                            sx={{
                                                mt: 1.5,
                                                p: 1.5,
                                                background: "#fafafa",
                                                borderRadius: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                {Object.entries(activity.metadata)
                                                    .map(
                                                        ([key, value]) =>
                                                            `${key}: ${typeof value === "object"
                                                                ? JSON.stringify(value)
                                                                : value
                                                            }`
                                                    )
                                                    .join(" • ")}
                                            </Typography>
                                        </Box>
                                    )}
                            </Box>
                        </Box>
                    ))}

                    {/* Pagination bar */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            px: { xs: 2, md: 2.5 },
                            py: 2,
                            borderTop: "1px solid #eeeeee",
                            background: "#fff",
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Rows per page
                            </Typography>

                            <Select
                                size="small"
                                value={rowsPerPage}
                                onChange={handleRowsPerPageChange}
                                inputProps={{
                                    "aria-label": "Rows per page",
                                }}
                                sx={{
                                    fontSize: 13,
                                    height: 32,
                                    "& .MuiSelect-select": {
                                        py: 0.5,
                                        px: 1,
                                    },
                                }}
                            >
                                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                                    <MenuItem
                                        key={option}
                                        value={option}
                                        sx={{ fontSize: 13 }}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {startIndex + 1}–{endIndex} of {totalItems}
                            </Typography>
                        </Stack>

                        {totalPages > 1 && (
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                size="small"
                                color="primary"
                                shape="rounded"
                                showFirstButton
                                showLastButton
                                siblingCount={0}
                                boundaryCount={1}
                                sx={{
                                    "& .MuiPaginationItem-root": {
                                        fontSize: 13,
                                    },
                                }}
                            />
                        )}
                    </Box>
                </Paper>
            )}
        </Box>
    );
}