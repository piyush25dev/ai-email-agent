"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/authClient";
import { auth } from "@/lib/firebase";

import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Chip,
} from "@mui/material";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import GmailIcon from "@mui/icons-material/Email";
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';

import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/common/PageHeader";

const DEFAULT_STATISTICS = {
    totalEmails: 0,
    aiProcessed: 0,
    pendingActions: 0,
    approved: 0,
    rejected: 0,
    emailsSent: 0,
};

export default function DashboardPage() {
    const [statistics, setStatistics] = useState(DEFAULT_STATISTICS);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [gmailStatus, setGmailStatus] = useState("checking");
    const [gmailEmail, setGmailEmail] = useState("");
    const [gmailLoading, setGmailLoading] = useState(false);

    async function loadDashboard() {
        try {
            setLoading(true);
            setError("");

            const headers = await getAuthHeaders();

            const response = await fetch("/api/dashboard/stats", {
                method: "GET",
                cache: "no-store",
                headers,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load dashboard"
                );
            }

            const dashboardData = result.data || {};

            setStatistics({
                ...DEFAULT_STATISTICS,
                ...(dashboardData.statistics || {}),
            });

            setRecentActivity(
                Array.isArray(dashboardData.recentActivity)
                    ? dashboardData.recentActivity
                    : []
            );
        } catch (error) {
            console.error("Dashboard loading error:", error);
            setError(
                error?.message || "Failed to load dashboard"
            );
        } finally {
            setLoading(false);
        }
    }

    async function checkGmailConnection() {
        try {
            setGmailStatus("checking");
            setGmailEmail("");

            const headers = await getAuthHeaders();
            const user = auth.currentUser;

            if (!user) {
                setGmailStatus("disconnected");
                return;
            }

            const response = await fetch(
                `/api/gmail/profile?userId=${encodeURIComponent(user.uid)}`,
                {
                    method: "GET",
                    cache: "no-store",
                    headers,
                }
            );

            const result = await response.json();

            if (
                response.ok &&
                result.success &&
                result.data?.emailAddress
            ) {
                setGmailEmail(result.data.emailAddress);
                setGmailStatus("connected");
            } else {
                setGmailStatus(
                    result.data?.needsReauth
                        ? "reauth"
                        : "disconnected"
                );
            }
        } catch (error) {
            console.error("Gmail connection check error:", error);
            setGmailStatus("reauth");
        }
    }

    function connectGmail() {
        const user = auth.currentUser;

        if (!user) {
            setError("You are not logged in.");
            return;
        }

        window.location.href =
            `/api/gmail/connect?userId=${encodeURIComponent(user.uid)}`;
    }

    useEffect(() => {
        loadDashboard();
        checkGmailConnection();
    }, []);

    useEffect(() => {
        const handleGmailSyncComplete = () => {
            loadDashboard();
            checkGmailConnection();
        };

        window.addEventListener(
            "gmail-sync-complete",
            handleGmailSyncComplete
        );

        return () => {
            window.removeEventListener(
                "gmail-sync-complete",
                handleGmailSyncComplete
            );
        };
    }, []);

    function getActivityLabel(type) {
        switch (type) {
            case "EMAIL_RECEIVED":
                return "Email Received";
            case "AI_ANALYZED":
                return "AI Analyzed";
            case "LEAVE_REQUEST_CREATED":
                return "Leave Request Created";
            case "MANAGER_NOTIFIED":
                return "Manager Notified";
            case "APPROVED":
                return "Leave Approved";
            case "REJECTED":
                return "Leave Rejected";
            case "LEAVE_NOTIFICATION_SENT":
                return "Employee Notified";
            case "LEAVE_REQUEST_SKIPPED":
                return "Leave Skipped";
            default:
                return type || "Activity";
        }
    }

    function getActivityColor(type) {
        switch (type) {
            case "APPROVED":
                return "success";
            case "REJECTED":
                return "error";
            case "LEAVE_NOTIFICATION_SENT":
                return "info";
            case "MANAGER_NOTIFIED":
                return "warning";
            case "AI_ANALYZED":
                return "secondary";
            case "LEAVE_REQUEST_CREATED":
                return "primary";
            default:
                return "default";
        }
    }

    function formatActivityDate(date) {
        if (!date) return "";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "";

        return parsedDate.toLocaleString("en-IN");
    }

    function renderGmailStatus() {
        if (gmailStatus === "checking") {
            return (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 3,
                        p: 2,
                        border: "1px solid #e5e7eb",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <CircularProgress
                        size={20}
                        sx={{ color: "#674D9F" }}
                    />

                    <Typography
                        sx={{
                            fontSize: 14,
                            color: "#6b7280",
                        }}
                    >
                        Checking Gmail connection...
                    </Typography>
                </Paper>
            );
        }

        if (gmailStatus === "connected") {
            return (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 3,
                        p: 2,
                        border: "1px solid #d1fae5",
                        backgroundColor: "#f0fdf4",
                        borderRadius: 3,
                        display: "flex",
                        alignItems: {
                            xs: "flex-start",
                            sm: "center",
                        },
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            minWidth: 0,
                        }}
                    >
                        <GmailIcon
                            sx={{
                                color: "#16a34a",
                                fontSize: 24,
                            }}
                        />

                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#166534",
                                }}
                            >
                                Gmail Connected
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: "#4b5563",
                                    wordBreak: "break-word",
                                }}
                            >
                                {gmailEmail}
                            </Typography>
                        </Box>
                    </Box>

                    <Chip
                        label="Connected"
                        color="success"
                        size="small"
                    />
                </Paper>
            );
        }

        return (
            <Paper
                elevation={0}
                sx={{
                    mb: 3,
                    p: 2,
                    border: "1px solid #fde68a",
                    backgroundColor: "#fffbeb",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: {
                        xs: "flex-start",
                        sm: "center",
                    },
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#92400e",
                        }}
                    >
                        {gmailStatus === "reauth"
                            ? "Gmail authorization expired"
                            : "Gmail is not connected"}
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            fontSize: 12,
                            color: "#6b7280",
                        }}
                    >
                        {gmailStatus === "reauth"
                            ? "Reconnect Gmail to continue receiving and processing emails."
                            : "Connect Gmail to allow the AI Email Agent to process your emails."}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    onClick={connectGmail}
                    disabled={gmailLoading}
                    sx={{
                        textTransform: "none",
                        backgroundColor: "#674D9F",
                        borderRadius: 2,
                        whiteSpace: "nowrap",
                        "&:hover": {
                            backgroundColor: "#39216D",
                        },
                    }}
                >
                    {gmailLoading ? (
                        <CircularProgress
                            size={18}
                            sx={{ color: "#fff" }}
                        />
                    ) : gmailStatus === "reauth" ? (
                        "Reconnect Gmail"
                    ) : (
                        "Connect Gmail"
                    )}
                </Button>
            </Paper>
        );
    }

    return (
        <Box
            sx={{
                flex: 1,
                p: {
                    xs: 2,
                    md: 4,
                },
                overflow: "hidden",
                minWidth: 0,
            }}
        >

            <PageHeader
            icon={<DashboardOutlinedIcon />}
                title="Dashboard"
                subtitle="Monitor your AI email processing activity"
                showGmailSync
                onGmailSyncComplete={() => {
                    loadDashboard();
                    checkGmailConnection();
                }}
            />

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {renderGmailStatus()}

            <Grid
                container
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Grid
                    size={{
                        xs: 6,
                        sm: 4,
                        md: 4,
                        lg: 2,
                    }}
                >
                    <StatCard
                        title="Total Emails"
                        value={statistics.totalEmails}
                        icon={<EmailOutlinedIcon />}
                    />
                </Grid>

                <Grid
                    size={{
                        xs: 6,
                        sm: 4,
                        md: 4,
                        lg: 2,
                    }}
                >
                    <StatCard
                        title="AI Processed"
                        value={statistics.aiProcessed}
                        icon={<AutoAwesomeOutlinedIcon />}
                    />
                </Grid>

                <Grid
                    size={{
                        xs: 6,
                        sm: 4,
                        md: 4,
                        lg: 2,
                    }}
                >
                    <StatCard
                        title="Pending Actions"
                        value={statistics.pendingActions}
                        icon={<PendingActionsOutlinedIcon />}
                    />
                </Grid>

                <Grid
                    size={{
                        xs: 6,
                        sm: 4,
                        md: 4,
                        lg: 2,
                    }}
                >
                    <StatCard
                        title="Approved"
                        value={statistics.approved}
                        icon={<CheckCircleIcon />}
                    />
                </Grid>

                <Grid
                    size={{
                        xs: 6,
                        sm: 4,
                        md: 4,
                        lg: 2,
                    }}
                >
                    <StatCard
                        title="Rejected"
                        value={statistics.rejected}
                        icon={<CancelOutlinedIcon />}
                    />
                </Grid>

                <Grid
                    size={{
                        xs: 6,
                        sm: 4,
                        md: 4,
                        lg: 2,
                    }}
                >
                    <StatCard
                        title="Emails Sent"
                        value={statistics.emailsSent}
                        icon={<SendOutlinedIcon />}
                    />
                </Grid>
            </Grid>

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
                <Box sx={{ p: 3 }}>
                    <Typography
                        sx={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#1f2937",
                        }}
                    >
                        Recent Activity
                    </Typography>

                    <Typography
                        sx={{
                            mt: 0.5,
                            fontSize: 13,
                            color: "#6b7280",
                        }}
                    >
                        Latest actions performed by the AI Email Agent
                    </Typography>
                </Box>

                {loading ? (
                    <Box
                        sx={{
                            py: 7,
                            display: "flex",
                            justifyContent: "center",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        <CircularProgress
                            sx={{
                                color: "#674D9F",
                            }}
                        />
                    </Box>
                ) : recentActivity.length === 0 ? (
                    <Box
                        sx={{
                            p: 6,
                            textAlign: "center",
                            borderTop: "1px solid #e5e7eb",
                        }}
                    >
                        <EmailOutlinedIcon
                            sx={{
                                fontSize: 42,
                                color: "#c4b5fd",
                                mb: 1,
                            }}
                        />

                        <Typography
                            sx={{
                                color: "#6b7280",
                                fontSize: 14,
                            }}
                        >
                            No activity to display yet
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {recentActivity.map((activity) => (
                            <Box
                                key={activity.id}
                                sx={{
                                    px: 3,
                                    py: 2,
                                    borderTop: "1px solid #e5e7eb",
                                    display: "flex",
                                    alignItems: {
                                        xs: "flex-start",
                                        sm: "center",
                                    },
                                    justifyContent: "space-between",
                                    gap: 2,
                                    flexDirection: {
                                        xs: "column",
                                        sm: "row",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        minWidth: 0,
                                        flex: 1,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: "#1f2937",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {activity.message ||
                                            "Activity performed"}
                                    </Typography>

                                    {activity.createdAt && (
                                        <Typography
                                            sx={{
                                                mt: 0.5,
                                                fontSize: 12,
                                                color: "#9ca3af",
                                            }}
                                        >
                                            {formatActivityDate(
                                                activity.createdAt
                                            )}
                                        </Typography>
                                    )}
                                </Box>

                                <Chip
                                    label={getActivityLabel(
                                        activity.type
                                    )}
                                    color={getActivityColor(
                                        activity.type
                                    )}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        flexShrink: 0,
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}