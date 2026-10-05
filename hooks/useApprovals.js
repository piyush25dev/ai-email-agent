import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/lib/authClient";

/**
 * Hook for managing leave approval requests
 */
export function useApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const headers = await getAuthHeaders();
      const response = await fetch("/api/dashboard/approvals", {
        method: "GET",
        cache: "no-store",
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load leave requests");
      }

      setRequests(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Load approvals error:", error);
      setError(error?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve request
  const approve = useCallback(
    async (requestId) => {
      try {
        setProcessingId(requestId);
        setError("");

        const headers = await getAuthHeaders();
        const response = await fetch(`/api/approvals/${requestId}/approve`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to approve leave");
        }

        await loadRequests();
      } catch (error) {
        console.error("Approve error:", error);
        setError(error?.message || "Failed to approve leave");
      } finally {
        setProcessingId(null);
      }
    },
    [loadRequests]
  );

  // Reject request
  const reject = useCallback(
    async (requestId, rejectionReason) => {
      try {
        const reason = rejectionReason.trim();

        if (!reason) {
          setError("Please provide a reason for rejecting the leave.");
          return;
        }

        if (reason.length > 500) {
          setError("Rejection reason cannot exceed 500 characters.");
          return;
        }

        setProcessingId(requestId);
        setError("");

        const headers = await getAuthHeaders();
        const response = await fetch(`/api/approvals/${requestId}/reject`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rejectionReason: reason }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to reject leave");
        }

        await loadRequests();
      } catch (error) {
        console.error("Reject error:", error);
        setError(error?.message || "Failed to reject leave");
      } finally {
        setProcessingId(null);
      }
    },
    [loadRequests]
  );

  return {
    requests,
    loading,
    error,
    processingId,
    loadRequests,
    approve,
    reject,
    setError,
  };
}