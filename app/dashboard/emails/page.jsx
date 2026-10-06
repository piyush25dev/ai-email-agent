"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/authClient";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { Box, Paper, Typography } from "@mui/material";
import CustomTable from "@/components/employees/CustomTable";
import PageHeader from "@/components/common/PageHeader";

function formatDate(date) {
    if (!date) return "-";

    let parsedDate;

    if (typeof date === "string" || typeof date === "number") {
        parsedDate = new Date(date);
    } else if (date instanceof Date) {
        parsedDate = date;
    } else if (date?.toDate) {
        parsedDate = date.toDate();
    } else if (date?._seconds) {
        parsedDate = new Date(date._seconds * 1000);
    } else {
        return "-";
    }

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ==========================================
// SENDER HELPERS
// ==========================================

function getSenderName(sender) {
    if (!sender) return "-";
    const match = sender.match(/^(.+?)\s*<[^>]+>$/);
    if (match) {
        return match[1].replace(/"/g, "").trim();
    }
    return sender;
}

function getSenderEmail(sender) {
    if (!sender) return "";
    const match = sender.match(/<([^>]+)>/);
    return match ? match[1] : sender;
}

// ==========================================
// COLUMN DEFINITIONS
// ==========================================

const tableColumns = [
    {
        key: "senderName",
        label: "Sender",
        minWidth: "160px",
    },
    {
        key: "senderEmail",
        label: "Email",
        minWidth: "200px",
    },
    {
        key: "subject",
        label: "Subject",
        minWidth: "160px",
        maxWidth: 320,
    },
    {
        key: "category",
        label: "Category",
        type: "status",
        minWidth: "120px",
        statusMap: {
            "Leave Requests": { color: "#1d4ed8", bgColor: "#dbeafe" },
            "Customer Support": { color: "#92400e", bgColor: "#fef3c7" },
            "Sales Enquiries": { color: "#065f46", bgColor: "#d1fae5" },
            "Interview Requests": { color: "#082f49", bgColor: "#e0f2fe" },
            "HR Requests": { color: "#5a3481", bgColor: "#ede9fe" },
            "Invoice/Payment Emails": { color: "#7f1d1d", bgColor: "#fee2e2" },
            "Not analyzed": { color: "#6b7280", bgColor: "#f3f4f6" },
        },
    },
    {
        key: "intentLabel",
        label: "Intent",
        minWidth: "120px",
    },
    {
        key: "confidencePct",
        label: "Confidence",
        type: "number",
        precision: 0,
        align: "center",
        minWidth: "60px",
    },
    {
        key: "receivedLabel",
        label: "Received",
        minWidth: "180px",
    },
];

export default function EmailsPage() {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchEmails() {
        try {
            setLoading(true);
            setError("");

            const headers = await getAuthHeaders();

            const response = await fetch(
                "/api/dashboard/emails?limit=50",
                {
                    method: "GET",
                    cache: "no-store",
                    headers,
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load emails"
                );
            }

            setEmails(
                Array.isArray(result.data) ? result.data : []
            );
        } catch (error) {
            console.error("Failed to load emails:", error);

            setError(error?.message || "Failed to load emails");
        } finally {
            setLoading(false);
        }
    }

    // INITIAL LOAD + GMAIL SYNC
    useEffect(() => {
        fetchEmails();

        const handleGmailSyncComplete = () => {
            fetchEmails();
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

    // MAP EMAILS -> TABLE ROWS
    const rows = emails.map((email) => {
        const confidence = email.analysis?.confidence;

        return {
            id: email.id,
            senderName: getSenderName(email.sender),
            senderEmail: getSenderEmail(email.sender),
            subject: email.subject || "-",
            category: email.analysis?.category || "Not analyzed",
            intentLabel:
                email.analysis?.intent?.replace(/_/g, " ") || "-",
            confidencePct:
                confidence !== undefined && confidence !== null
                    ? Math.round(confidence * 100)
                    : undefined,
            receivedLabel: formatDate(email.receivedAt),
        };
    });

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                p: { xs: 2, md: 4 },
                overflow: "hidden",
                minWidth: 0,
            }}
        >
            {/* Header */}
            <PageHeader
            icon={<EmailOutlinedIcon />}
                title="Emails"
                subtitle="View emails received from employees registered in the system."
                showGmailSync
                onGmailSyncComplete={fetchEmails}
            />

            {/* Error */}

            {error && (
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        boxShadow:
            "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <Typography color="error">{error}</Typography>
                </Paper>
            )}

            {/* Email Table */}

            <CustomTable
                columns={tableColumns}
                rows={rows}
                loading={loading}
                pagination={true}
                rowsPerPageDefault={10}
                emptyMessage="No employee emails available"
            />
        </Box>
    );
}