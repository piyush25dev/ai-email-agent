"use client";

import { useState } from "react";

export default function TestAI() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEmail = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: "rahul@example.com",
          subject: "Leave Request",
          body: `
Hi Sir,

I would like to take leave from 25 September
to 27 September due to a family function.

Please approve my leave.

Regards,
Rahul
          `,
        }),
      });

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>AI Email Agent</h1>

      <button onClick={testEmail}>
        {loading ? "Analyzing..." : "Analyze Email"}
      </button>

      {result && (
        <pre style={{ marginTop: "30px" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}