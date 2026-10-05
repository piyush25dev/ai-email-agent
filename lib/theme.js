import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#667eea",
      light: "#8b9dff",
      dark: "#5568d3",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#764ba2",
      light: "#9b6bcc",
      dark: "#5a3481",
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#1d4ed8",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a2e",
      secondary: "#6b7280",
      disabled: "#9ca3af",
    },
    divider: "#e5e7eb",
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h3: {
      fontSize: "28px",
      fontWeight: 700,
      letterSpacing: "-0.5px",
      lineHeight: 1.2,
    },
    h4: {
      fontSize: "24px",
      fontWeight: 700,
      letterSpacing: "-0.3px",
    },
    h5: {
      fontSize: "20px",
      fontWeight: 600,
      letterSpacing: "-0.2px",
    },
    h6: {
      fontSize: "16px",
      fontWeight: 600,
    },
    body1: {
      fontSize: "16px",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "14px",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    caption: {
      fontSize: "12px",
      lineHeight: 1.4,
    },
  },

  components: {
    // Card Component
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 13px rgba(0, 0, 0, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
          transition: "all 0.3s ease",

          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow:
              "0 8px 12px rgba(0, 0, 0, 0.1), 0 12px 20px rgba(0, 0, 0, 0.08)",
          },
        },
      },
    },

    // Button Component
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 600,
          padding: "10px 20px",
          transition: "all 0.3s ease",
          textTransform: "none",

          "&:disabled": {
            opacity: 0.6,
          },
        },

        contained: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#ffffff",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",

          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 25px rgba(102, 126, 234, 0.5)",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          },

          "&:active": {
            transform: "translateY(0)",
          },
        },

        outlined: {
          borderColor: "#e5e7eb",
          color: "#667eea",

          "&:hover": {
            borderColor: "#667eea",
            backgroundColor: "#f0f0ff",
          },
        },

        text: {
          color: "#667eea",

          "&:hover": {
            backgroundColor: "rgba(102, 126, 234, 0.1)",
          },
        },
      },
    },

    // TextField Component
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
            transition: "all 0.2s ease",

            "&:hover": {
              backgroundColor: "#f3f4f6",
            },

            "&.Mui-focused": {
              backgroundColor: "#ffffff",
              boxShadow: "0 0 0 3px rgba(102, 126, 234, 0.1)",
            },
          },
        },
      },
    },

    // Alert Component
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          border: "1px solid",
          fontSize: "14px",

          "&.MuiAlert-standardSuccess": {
            backgroundColor: "#ecfdf5",
            borderColor: "#10b981",
            color: "#065f46",
          },

          "&.MuiAlert-standardError": {
            backgroundColor: "#fef2f2",
            borderColor: "#ef4444",
            color: "#7f1d1d",
          },

          "&.MuiAlert-standardWarning": {
            backgroundColor: "#fefce8",
            borderColor: "#f59e0b",
            color: "#92400e",
          },

          "&.MuiAlert-standardInfo": {
            backgroundColor: "#eff6ff",
            borderColor: "#3b82f6",
            color: "#082f49",
          },
        },
      },
    },

    // Table Component
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f9fafb",
          borderBottom: "2px solid #e5e7eb",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#374151",
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "16px",
          backgroundColor: "#f9fafb",
        },

        body: {
          padding: "16px",
          borderBottom: "1px solid #e5e7eb",
          fontSize: "14px",
          color: "#1a1a2e",

          "&:last-child": {
            borderRight: "none",
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.2s ease",

          "&:hover": {
            backgroundColor: "#f9fafb",
          },

          "&:last-child td": {
            borderBottom: "none",
          },
        },
      },
    },

    // Chip Component
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "12px",
          borderRadius: "8px",
        },

        colorSuccess: {
          backgroundColor: "#d1fae5",
          color: "#065f46",
        },

        colorError: {
          backgroundColor: "#fee2e2",
          color: "#7f1d1d",
        },

        colorDefault: {
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
        },
      },
    },

    // Dialog Component
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "20px",
          fontWeight: 700,
          color: "#1a1a2e",
          padding: "24px",
          borderBottom: "1px solid #e5e7eb",
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "24px",
          color: "#6b7280",
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          borderTop: "1px solid #e5e7eb",
          gap: "12px",
        },
      },
    },

    // IconButton Component
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.3s ease",
          borderRadius: "10px",

          "&:hover": {
            backgroundColor: "rgba(102, 126, 234, 0.1)",
          },
        },

        colorPrimary: {
          color: "#667eea",

          "&:hover": {
            backgroundColor: "rgba(102, 126, 234, 0.1)",
          },
        },

        colorError: {
          color: "#ef4444",

          "&:hover": {
            backgroundColor: "rgba(239, 68, 68, 0.1)",
          },
        },
      },
    },

    // Tooltip Component
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1a1a2e",
          color: "#ffffff",
          fontSize: "12px",
          borderRadius: "8px",
          fontWeight: 500,
        },
      },
    },
  },
});