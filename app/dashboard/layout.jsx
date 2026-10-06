"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";

const BG = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";
const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
const ALLOWED_ROLES = ["admin", "manager"];

const Screen = ({ children }) => (
  <Box
    sx={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column", gap: 2,
      px: 2, background: BG,
    }}
  >
    {children}
  </Box>
);

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | ok | denied
  const [error, setError] = useState("");
  const deniedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      // Not logged in (skip redirect if we signed the user out ourselves,
      // so the "Access Denied" screen stays visible)
      if (!user) {
        if (!deniedRef.current) router.replace("/login");
        return;
      }

      deniedRef.current = false;

      const deny = async (msg) => {
        deniedRef.current = true;
        setError(msg);
        setStatus("denied");
        await signOut(auth).catch(console.error);
      };

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!mounted) return;

        if (!snap.exists()) {
          return deny("No application user profile was found for this account.");
        }

        const data = snap.data();
        const role = String(data.role || "").trim().toLowerCase();

        if (!ALLOWED_ROLES.includes(role)) {
          return deny(
            `You don't have permission to access the dashboard. ` +
            `Current role: ${role || "not assigned"}`
          );
        }

        // Missing status is treated as active
        if (data.status && String(data.status).trim().toUpperCase() !== "ACTIVE") {
          return deny("Your account is inactive. Please contact the administrator.");
        }

        setError("");
        setStatus("ok");
      } catch (e) {
        console.error("Dashboard authorization error:", e);
        if (!mounted) return;
        setError("Unable to verify your account. Please try again.");
        setStatus("denied");
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  const backToLogin = async () => {
    await signOut(auth).catch(console.error);
    router.replace("/login");
  };

  if (status === "loading") {
    return (
      <Screen>
        <CircularProgress size={42} sx={{ color: "#667eea" }} />
        <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
          Verifying your account...
        </Typography>
      </Screen>
    );
  }

  if (status === "denied") {
    return (
      <Screen>
        <Box
          sx={{
            width: "100%", maxWidth: 480, bgcolor: "#fff", borderRadius: "20px",
            p: { xs: 3, sm: 5 }, textAlign: "center",
            boxShadow: "0 15px 40px rgba(0,0,0,.08)", border: "1px solid #e5e7eb",
          }}
        >
          <Box
            sx={{
              width: 70, height: 70, borderRadius: "50%", bgcolor: "#fef2f2",
              color: "#dc2626", display: "flex", alignItems: "center",
              justifyContent: "center", mx: "auto", mb: 2.5,
              fontSize: 36, fontWeight: 700,
            }}
          >
            !
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1f2937", mb: 1 }}>
            Access Denied
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7, mb: 3 }}>
            {error || "You are not authorized to access this dashboard."}
          </Typography>
          <Button
            variant="contained"
            onClick={backToLogin}
            sx={{
              px: 4, py: 1.2, borderRadius: "10px", textTransform: "none",
              fontWeight: 600, background: GRAD,
              "&:hover": { background: "linear-gradient(135deg, #5a6fd8, #6a4192)" },
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Screen>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1, minWidth: 0, height: "100vh", overflow: "auto", background: BG,
          ml: { xs: 0, md: "var(--sidebar-w, 280px)" },
          transition: "margin-left .25s ease",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}