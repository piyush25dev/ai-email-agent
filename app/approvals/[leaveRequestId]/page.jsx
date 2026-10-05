"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function ApprovalPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const leaveRequestId = params.leaveRequestId;
  const decision = searchParams.get("decision");

  const [status, setStatus] = useState("Processing...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function processDecision() {
      if (!leaveRequestId) {
        setError("Leave request ID is missing.");
        return;
      }

      if (decision !== "approve" && decision !== "reject") {
        setError("Invalid approval action.");
        return;
      }

      try {
        setStatus(
          decision === "approve"
            ? "Approving leave request..."
            : "Rejecting leave request..."
        );

        const endpoint =
          decision === "approve"
            ? `/api/approvals/${leaveRequestId}/approve`
            : `/api/approvals/${leaveRequestId}/reject`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "test-user-001",
            managerId: "test-manager-001",
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to process the request."
          );
        }

        setStatus(
          decision === "approve"
            ? "Leave request approved successfully."
            : "Leave request rejected successfully."
        );
      } catch (error) {
        console.error("Approval error:", error);

        setError(
          error.message || "Something went wrong."
        );
      }
    }

    processDecision();
  }, [leaveRequestId, decision]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#f5f5f5",
        color: "#000"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#fff",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1>AI Email Agent</h1>

        {error ? (
          <>
            <h2 style={{ color: "#d32f2f" }}>
              Action Failed
            </h2>

            <p>{error}</p>
          </>
        ) : (
          <>
            <h2>
              {decision === "approve"
                ? "Leave Approved"
                : "Leave Rejected"}
            </h2>

            <p>{status}</p>
          </>
        )}
      </div>
    </div>
  );
}