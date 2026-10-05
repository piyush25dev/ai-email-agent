"use client";

import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PeopleIcon from "@mui/icons-material/People";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <DashboardOutlinedIcon />,
    },
    {
      label: "Emails",
      path: "/dashboard/emails",
      icon: <EmailOutlinedIcon />,
    },
    {
      label: "Approvals",
      path: "/dashboard/approvals",
      icon: <ApprovalOutlinedIcon />,
    },
    {
      label: "Activity",
      path: "/dashboard/activity",
      icon: <HistoryOutlinedIcon />,
    },
    {
      label: "Employees",
      path: "/dashboard/employees",
      icon: <PeopleIcon />,
    },
  ];

  const handleNavigate = (path) => {
    router.push(path);

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      // Sign out from Firebase Authentication
      await signOut(auth);

      // Close mobile drawer if open
      if (isMobile) {
        setMobileOpen(false);
      }

      // Redirect to login page
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);

      setLoggingOut(false);
    }
  };

  const SidebarContent = ({ showCloseButton = false }) => (
    <>
      {/* Logo Section - Fixed */}
      <Box
        sx={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-1px",
              }}
            >
              AI
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.2,
              }}
            >
              Email Agent
            </Typography>

            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.7)",
                letterSpacing: "0.5px",
              }}
            >
              DASHBOARD
            </Typography>
          </Box>
        </Box>

        {showCloseButton && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{
              color: "#ffffff",
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider
        sx={{
          opacity: 0.1,
          flexShrink: 0,
        }}
      />

      {/* Navigation - Scrollable only within sidebar */}
      <List
        sx={{
          px: 1.5,
          py: 3,
          flex: 1,
          overflow: "auto",
          overflowX: "hidden",

          /* Custom scrollbar - thin and subtle */
          "&::-webkit-scrollbar": {
            width: "6px",
          },

          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },

          "&::-webkit-scrollbar-thumb": {
            background: "#d1d5db",
            borderRadius: "3px",

            "&:hover": {
              background: "#9ca3af",
            },
          },
        }}
      >
        {menuItems.map((item) => {
          const active = pathname === item.path;

          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: "12px",
                mb: 1,
                px: 2.5,
                py: 1.5,
                color: active ? "#667eea" : "#6b7280",
                backgroundColor: active
                  ? "#ede9fe"
                  : "transparent",
                fontWeight: active ? 600 : 500,
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,

                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: active ? "4px" : "0px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "0 8px 8px 0",
                  transition: "width 0.3s ease",
                },

                "&:hover": {
                  backgroundColor: "#f3f0ff",
                  color: "#667eea",
                  transform: "translateX(4px)",

                  "&::before": {
                    width: "4px",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: "inherit",
                  transition: "all 0.3s ease",
                  fontSize: "22px",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.label} />

              {active && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    ml: "auto",
                    animation: "pulse 2s infinite",
                    flexShrink: 0,

                    "@keyframes pulse": {
                      "0%, 100%": {
                        opacity: 1,
                      },
                      "50%": {
                        opacity: 0.5,
                      },
                    },
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer Section - Fixed at bottom */}
      <Box
        sx={{
          px: 2,
          py: 3,
          borderTop: "1px solid #e5e7eb",
          flexShrink: 0,
          backgroundColor: "#ffffff",
        }}
      >
        {/* Connection Status */}
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            background:
              "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.2)",
          }}
        >
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#667eea",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            Status
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow:
                  "0 0 8px rgba(16, 185, 129, 0.4)",
                flexShrink: 0,
              }}
            />

            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#1a1a2e",
              }}
            >
              Connected
            </Typography>
          </Box>
        </Box>

        {/* Logout Button */}
        <ListItemButton
          onClick={handleLogout}
          disabled={loggingOut}
          sx={{
            mt: 2,
            borderRadius: "12px",
            px: 2,
            py: 1.5,
            color: "#dc2626",
            transition: "all 0.3s ease",

            "&:hover": {
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              transform: "translateX(4px)",
            },

            "&.Mui-disabled": {
              color: "#fca5a5",
              opacity: 0.7,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: "inherit",
            }}
          >
            <LogoutIcon />
          </ListItemIcon>

          <ListItemText
            primary={loggingOut ? "Logging out..." : "Logout"}
          />
        </ListItemButton>
      </Box>
    </>
  );

  /* =========================
     MOBILE SIDEBAR
  ========================= */
  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Box
          sx={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1200,
            display: {
              xs: "flex",
              md: "none",
            },
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              width: 48,
              height: 48,
              boxShadow:
                "0 4px 12px rgba(102, 126, 234, 0.3)",

              "&:hover": {
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                transform: "scale(1.05)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        >
          <SidebarContent showCloseButton={true} />
        </Drawer>
      </>
    );
  }

  /* =========================
     DESKTOP SIDEBAR
  ========================= */
  return (
    <Box
      sx={{
        width: 280,
        height: "100vh",
        borderRight: "1px solid #e5e7eb",
        background:
          "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "2px 0 8px rgba(0, 0, 0, 0.04)",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      <SidebarContent showCloseButton={false} />
    </Box>
  );
}