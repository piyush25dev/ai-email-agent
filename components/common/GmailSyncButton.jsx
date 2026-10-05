"use client";

import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { getAuthHeaders } from "@/lib/authClient";

const baseIconSx = {
  width: 20,
  height: 20,
  display: "block",
  flexShrink: 0,
};

function MailIcon({ sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      sx={{ ...baseIconSx, ...sx }}
    >
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
      />
    </Box>
  );
}

function CheckCircleIcon({ sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      sx={{ ...baseIconSx, width: 18, height: 18, ...sx }}
    >
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
      />
    </Box>
  );
}

function ErrorCircleIcon({ sx }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      sx={{ ...baseIconSx, width: 18, height: 18, ...sx }}
    >
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
      />
    </Box>
  );
}

export default function GmailSyncButton({
  onSyncComplete,
  variant = "contained",
  size = "medium",
}) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage("");
      setStatus("idle");

      const headers = await getAuthHeaders();

      const response = await fetch("/api/gmail/process", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 100,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to sync Gmail");
      }

      const processed = result.data?.processed || 0;
      const found = result.data?.found ?? processed;

      setStatus("success");
      setMessage(`Synced ${found} new email${found === 1 ? "" : "s"}`);

      // Tell every page that Gmail synchronization finished
      window.dispatchEvent(
        new CustomEvent("gmail-sync-complete", {
          detail: result.data,
        })
      );

      if (onSyncComplete) {
        await onSyncComplete(result.data);
      }
    } catch (error) {
      console.error("Gmail sync error:", error);

      setStatus("error");
      setMessage(error?.message || "Failed to sync Gmail");
    } finally {
      setSyncing(false);
    }
  };

  const isContained = variant === "contained";
  const isError = status === "error";

  return (
    <Stack
      direction="row"
      spacing={1.5}
      useFlexGap
    >
      <Button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        variant={variant}
        size={size}
        aria-busy={syncing}
        startIcon={
          syncing ? (
            <CircularProgress size={18} thickness={5} color="inherit" />
          ) : (
            <MailIcon />
          )
        }
        sx={{
          minWidth: 176,
          position: "relative",
          overflow: "hidden",

          ...(isContained && {
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
              transform: "translateX(-130%)",
              transition: "transform 0.65s ease",
            },
            "&:hover::before": {
              transform: "translateX(130%)",
            },
          }),
        }}
      >
        {syncing ? "Syncing Gmail…" : "Sync Gmail"}
      </Button>

      {message && (
        <Stack
          direction="row"
          spacing={0.75}
          role="status"
          aria-live="polite"
          sx={{
            px: 1.5,
            py: 0.75,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: isError ? "error.light" : "success.light",
            backgroundColor: isError ? "#fef2f2" : "#ecfdf5",
            color: isError ? "error.dark" : "success.dark",

            animation: "gmailSyncFadeIn 0.35s ease both",
            "@keyframes gmailSyncFadeIn": {
              from: { opacity: 0, transform: "translateY(-4px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {isError ? <ErrorCircleIcon /> : <CheckCircleIcon />}

          <Typography
            variant="body2"
            sx={{ fontWeight: 600, lineHeight: 1.2 }}
          >
            {message}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}