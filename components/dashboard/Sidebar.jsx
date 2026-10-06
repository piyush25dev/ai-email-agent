"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, useMediaQuery, useTheme, Drawer, IconButton, Tooltip,
} from "@mui/material";
import {
  DashboardOutlined, EmailOutlined, ApprovalOutlined, HistoryOutlined,
  People, Logout, Menu, Close, ChevronLeft, ChevronRight,
} from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const GRAD = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
const W = 280;
const CW = 80;

const ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlined /> },
  { label: "Emails", path: "/dashboard/emails", icon: <EmailOutlined /> },
  { label: "Approvals", path: "/dashboard/approvals", icon: <ApprovalOutlined /> },
  { label: "Activity", path: "/dashboard/activity", icon: <HistoryOutlined /> },
  { label: "Employees", path: "/dashboard/employees", icon: <People /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Restore saved state
  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  // Expose width so the page content can shift with the sidebar
  useEffect(() => {
    const w = isMobile ? 0 : collapsed ? CW : W;
    document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
  }, [collapsed, isMobile]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  };

  const go = (path) => {
    router.push(path);
    setOpen(false);
  };

  const logout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await signOut(auth);
      setOpen(false);
      router.replace("/login");
    } catch (e) {
      console.error("Logout failed:", e);
      setLoggingOut(false);
    }
  };

  const content = (mini, onClose) => (
    <>
      {/* Header */}
      <Box
        sx={{
          height: 72, px: mini ? 0 : 3, background: GRAD, flexShrink: 0,
          display: "flex", alignItems: "center",
          justifyContent: mini ? "center" : "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: "10px", color: "#fff",
              bgcolor: "rgba(255,255,255,.2)", fontSize: 20, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            AI
          </Box>
          {!mini && (
            <Box sx={{ color: "#fff" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                Email Agent
              </Typography>
              <Typography sx={{ fontSize: 10, opacity: 0.7, letterSpacing: ".5px" }}>
                DASHBOARD
              </Typography>
            </Box>
          )}
        </Box>
        {onClose && (
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <Close />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ opacity: 0.1, flexShrink: 0 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 3, flex: 1, overflow: "auto", overflowX: "hidden" }}>
        {ITEMS.map(({ label, path, icon }) => {
          const active = pathname === path;
          return (
            <Tooltip key={path} title={mini ? label : ""} placement="right">
              <ListItemButton
                onClick={() => go(path)}
                sx={{
                  borderRadius: "12px", mb: 1, py: 1.5, px: mini ? 0 : 2.5,
                  justifyContent: mini ? "center" : "flex-start",
                  color: active ? "#667eea" : "#6b7280",
                  bgcolor: active ? "#ede9fe" : "transparent",
                  fontWeight: active ? 600 : 500,
                  transition: "all .3s ease",
                  position: "relative", overflow: "hidden",
                  "&::before": {
                    content: '""', position: "absolute", left: 0, top: 0,
                    bottom: 0, width: active ? 4 : 0, background: GRAD,
                    borderRadius: "0 8px 8px 0", transition: "width .3s",
                  },
                  "&:hover": {
                    bgcolor: "#f3f0ff", color: "#667eea",
                    "&::before": { width: 4 },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: mini ? 0 : 40, color: "inherit" }}
                >
                  {icon}
                </ListItemIcon>
                {!mini && <ListItemText primary={label} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid #e5e7eb", bgcolor: "#fff" }}>
        <Box
          sx={{
            p: mini ? 1.5 : 2, borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(102,126,234,.1), rgba(118,75,162,.1))",
            border: "1px solid rgba(102,126,234,.2)",
          }}
        >
          {!mini && (
            <Typography
              sx={{
                fontSize: 12, fontWeight: 600, color: "#667eea", mb: 0.5,
                textTransform: "uppercase", letterSpacing: ".5px",
              }}
            >
              Status
            </Typography>
          )}
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              justifyContent: mini ? "center" : "flex-start",
            }}
          >
            <Box
              sx={{
                width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981",
                boxShadow: "0 0 8px rgba(16,185,129,.4)",
              }}
            />
            {!mini && (
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                Connected
              </Typography>
            )}
          </Box>
        </Box>

        <Tooltip title={mini ? "Logout" : ""} placement="right">
          <ListItemButton
            onClick={logout}
            disabled={loggingOut}
            sx={{
              mt: 2, borderRadius: "12px", py: 1.5, px: mini ? 0 : 2,
              justifyContent: mini ? "center" : "flex-start",
              color: "#dc2626", transition: "all .3s ease",
              "&:hover": { bgcolor: "#fef2f2", color: "#b91c1c" },
            }}
          >
            <ListItemIcon sx={{ minWidth: mini ? 0 : 40, color: "inherit" }}>
              <Logout />
            </ListItemIcon>
            {!mini && (
              <ListItemText primary={loggingOut ? "Logging out..." : "Logout"} />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </>
  );

  /* Mobile */
  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed", top: 16, right: 16, zIndex: 1200,
            width: 48, height: 48, color: "#fff", background: GRAD,
            boxShadow: "0 4px 12px rgba(102,126,234,.3)",
            "&:hover": { background: GRAD },
          }}
        >
          <Menu />
        </IconButton>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
        >
          {content(false, () => setOpen(false))}
        </Drawer>
      </>
    );
  }

  /* Desktop */
  return (
    <Box
      sx={{
        position: "fixed", left: 0, top: 0, height: "100vh", zIndex: 100,
        width: collapsed ? CW : W, transition: "width .25s ease",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid #e5e7eb", boxShadow: "2px 0 8px rgba(0,0,0,.04)",
        background: "linear-gradient(to bottom, #fff 0%, #f9fafb 100%)",
      }}
    >
      <IconButton
        size="small"
        onClick={toggle}
        sx={{
          position: "absolute", top: 28, right: -14, zIndex: 1,
          width: 28, height: 28, bgcolor: "#fff", color: "#667eea",
          border: "1px solid #e5e7eb", boxShadow: "0 2px 6px rgba(0,0,0,.1)",
          "&:hover": { bgcolor: "#f3f0ff" },
        }}
      >
        {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
      </IconButton>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {content(collapsed)}
      </Box>
    </Box>
  );
}