"use client";

import { useState } from "react";

export default function TestEmail() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const processEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/emails/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test-user-001",
          sender: "rahul@example.com",
          subject: "Leave Request",
          body: "Hi Sir, I would like to take leave from 25 September to 27 September due to a family function. Please approve my leave. Regards, Rahul",
        }),
      });

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error(error);

      setResult({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Test Email Processing</h1>

      <button
        onClick={processEmail}
        disabled={loading}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        {loading ? "Processing..." : "Process Email"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "",
            overflow: "auto",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}