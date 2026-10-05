"use client";

import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ConnectGmailButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();

      if (!user) {
        setLoading(false);
        return;
      }

      window.location.href = `/api/auth/google?userId=${encodeURIComponent(
        user.uid
      )}`;
    });
  };

  return (
    <Button
      type="button"
      variant="contained"
      onClick={handleConnect}
      disabled={loading}
    >
      {loading ? (
        <>
          <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
          Connecting...
        </>
      ) : (
        "Connect Gmail"
      )}
    </Button>
  );
}