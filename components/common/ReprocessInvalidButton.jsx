"use client";

import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { getAuthHeaders } from "@/lib/authClient";

export default function ReprocessInvalidButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReprocess = async () => {
    try {
      setLoading(true);
      setMessage("");

      const headers = await getAuthHeaders();

      const response = await fetch("/api/gmail/reprocess-invalid", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 50,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to reprocess emails");
      }

      setMessage(
        `Reprocessed ${result.data?.processed || 0} email(s)`
      );

      window.dispatchEvent(new CustomEvent("gmail-sync-complete"));
    } catch (error) {
      console.error("Reprocess error:", error);
      setMessage(error.message || "Failed to reprocess emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleReprocess}
        disabled={loading}
      >
        {loading ? <CircularProgress size={20} /> : "Reprocess Invalid Emails"}
      </Button>

      {message && (
        <span style={{ marginLeft: 12 }}>
          {message}
        </span>
      )}
    </>
  );
}