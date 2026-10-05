"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";

import {
  Box,
  Button,
  Card,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
  Alert,
  IconButton,
} from "@mui/material";

import GoogleIcon from "@mui/icons-material/Google";
import CloseIcon from "@mui/icons-material/Close";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await signInWithPopup(auth, googleProvider);

      console.log("Firebase user:", result.user);
      console.log("Firebase UID:", result.user.uid);
      console.log("Email:", result.user.email);

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2,
        position: "relative",
        overflow: "hidden",

        "&::before": {
          content: '""',
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "50%",
          top: "-100px",
          left: "-100px",
          zIndex: 0,
        },

        "&::after": {
          content: '""',
          position: "absolute",
          width: "300px",
          height: "300px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          bottom: "-50px",
          right: "-50px",
          zIndex: 0,
        },
      }}
    >
      {/* Left Section - Content (Hidden on mobile) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          flex: 1,
          px: 6,
          zIndex: 1,
          color: "#ffffff",
          maxWidth: "500px",
        }}
      >
        <Box
          sx={{
            mb: 3,
            width: 60,
            height: 60,
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <Typography
            sx={{
              fontSize: 32,
              fontWeight: 800,
              background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: "48px",
            fontWeight: 800,
            lineHeight: 1.2,
            mb: 2,
            letterSpacing: "-1px",
          }}
        >
          Smart Email Management
        </Typography>

        <Typography
          sx={{
            fontSize: "18px",
            lineHeight: 1.6,
            opacity: 0.9,
            mb: 4,
            maxWidth: "400px",
          }}
        >
          Streamline your workflow with AI-powered email handling and intelligent leave request management.
        </Typography>

        {/* Features */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { icon: "✓", text: "Smart email filtering" },
            { icon: "✓", text: "Automated leave tracking" },
            { icon: "✓", text: "Real-time notifications" },
          ].map((feature, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {feature.icon}
              </Box>
              <Typography sx={{ fontSize: "16px" }}>
                {feature.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right Section - Login Card */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          maxWidth: { xs: "100%", md: "500px" },
          px: { xs: 0, md: 3 },
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: "420px" },
            borderRadius: { xs: "24px", sm: "24px" },
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#1a1a2e",
                  fontSize: { xs: "28px", sm: "32px" },
                  letterSpacing: "-0.5px",
                }}
              >
                Welcome Back
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#6b7280",
                fontSize: "15px",
                mb: 4,
                lineHeight: 1.5,
              }}
            >
              Sign in to access your AI Email Agent dashboard and manage your communications.
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  border: "1px solid #fecaca",
                  backgroundColor: "#fef2f2",
                  color: "#7f1d1d",
                  "& .MuiAlert-action": {
                    p: 0,
                  },
                }}
                action={
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => setError("")}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            )}

            {/* Google Login Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                textTransform: "none",
                padding: "14px 20px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,

                "&:hover:not(:disabled)": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.5)",
                },

                "&:active:not(:disabled)": {
                  transform: "translateY(0)",
                },

                "&:disabled": {
                  opacity: 0.8,
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <GoogleIcon sx={{ fontSize: "20px" }} />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Footer Text */}
            <Typography
              sx={{
                fontSize: "12px",
                color: "#9ca3af",
                textAlign: "center",
                mt: 4,
                lineHeight: 1.5,
              }}
            >
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* Mobile Logo - Top Right */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          display: { xs: "flex", md: "none" },
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            AI
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}