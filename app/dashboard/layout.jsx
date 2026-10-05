"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // =====================================================
      // 1. USER IS NOT LOGGED IN
      // =====================================================

      if (!user) {
        if (!mounted) return;

        setAuthorized(false);
        setLoading(false);

        router.replace("/login");
        return;
      }

      try {
        console.log("Firebase authenticated user:", {
          uid: user.uid,
          email: user.email,
        });

        // =====================================================
        // 2. GET USER PROFILE USING FIREBASE AUTH UID
        // =====================================================

        const userRef = doc(db, "users", user.uid);

        const userSnapshot = await getDoc(userRef);

        // =====================================================
        // 3. USER PROFILE DOES NOT EXIST
        // =====================================================

        if (!userSnapshot.exists()) {
          console.error(
            "User profile not found in Firestore:",
            user.uid
          );

          if (!mounted) return;

          setAuthorized(false);
          setError(
            "Your account is authenticated, but no application user profile was found."
          );
          setLoading(false);

          await signOut(auth);

          router.replace("/login");

          return;
        }

        // =====================================================
        // 4. GET USER DATA
        // =====================================================

        const userData = userSnapshot.data();

        console.log("Firestore user profile:", userData);

        // =====================================================
        // 5. CHECK ROLE
        // =====================================================

        const role = String(userData.role || "")
          .trim()
          .toLowerCase();

        console.log("Application role:", role);

        const allowedRoles = ["admin", "manager"];

        if (!allowedRoles.includes(role)) {
          console.error(
            "Unauthorized role:",
            role
          );

          if (!mounted) return;

          setAuthorized(false);
          setError(
            `Your account does not have permission to access the dashboard. Current role: ${
              role || "not assigned"
            }`
          );
          setLoading(false);

          await signOut(auth);

          router.replace("/login");

          return;
        }

        // =====================================================
        // 6. OPTIONAL ACCOUNT STATUS CHECK
        // =====================================================
        //
        // If the status field does not exist, the user is
        // allowed because your current user document only
        // contains email and role.
        //

        if (
          userData.status &&
          String(userData.status)
            .trim()
            .toUpperCase() !== "ACTIVE"
        ) {
          console.error(
            "User account is not active:",
            userData.status
          );

          if (!mounted) return;

          setAuthorized(false);
          setError(
            "Your account is currently inactive. Please contact the administrator."
          );
          setLoading(false);

          await signOut(auth);

          router.replace("/login");

          return;
        }

        // =====================================================
        // 7. USER AUTHORIZED
        // =====================================================

        console.log(
          "User authorization successful."
        );

        if (!mounted) return;

        setAuthorized(true);
        setError("");
        setLoading(false);
      } catch (error) {
        console.error(
          "Dashboard authorization error:",
          error
        );

        if (!mounted) return;

        setAuthorized(false);
        setError(
          "Unable to verify your account. Please try again."
        );
        setLoading(false);
      }
    });

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          gap: 2,
        }}
      >
        <CircularProgress
          size={42}
          sx={{
            color: "#667eea",
          }}
        />

        <Typography
          sx={{
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          Verifying your account...
        </Typography>
      </Box>
    );
  }

  // =========================================================
  // UNAUTHORIZED / ERROR SCREEN
  // =========================================================

  if (!authorized) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          background:
            "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: {
              xs: 3,
              sm: 5,
            },
            textAlign: "center",
            boxShadow:
              "0 15px 40px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Error icon */}
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            !
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              mb: 1,
            }}
          >
            Access Denied
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              fontSize: 14,
              lineHeight: 1.7,
              mb: 3,
            }}
          >
            {error ||
              "You are not authorized to access this dashboard."}
          </Typography>

          <Button
            variant="contained"
            onClick={async () => {
              try {
                await signOut(auth);
              } catch (error) {
                console.error(
                  "Logout error:",
                  error
                );
              }

              router.replace("/login");
            }}
            sx={{
              px: 4,
              py: 1.2,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

              "&:hover": {
                background:
                  "linear-gradient(135deg, #5a6fd8 0%, #6a4192 100%)",
              },
            }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    );
  }

  // =========================================================
  // AUTHORIZED DASHBOARD
  // =========================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Dashboard content */}
      <Box
        sx={{
          flex: 1,
          marginLeft: {
            xs: 0,
            md: "280px",
          },
          overflow: "auto",
          height: "100vh",
          background:
            "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}