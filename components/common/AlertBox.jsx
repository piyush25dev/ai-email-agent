import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";


export function AlertBox({ message, error, onClose }) {
  if (!message && !error) return null;

  const isError = Boolean(error);
  const alertMessage = error || message;

  return (
    <Alert
      severity={isError ? "error" : "success"}
      sx={{
        mb: 3,
        borderRadius: "12px",
        backgroundColor: isError ? "#fef2f2" : "#ecfdf5",
        borderColor: isError ? "#ef4444" : "#10b981",
        color: isError ? "#7f1d1d" : "#065f46",
        border: "1px solid",
      }}
      action={
        <IconButton size="small" color="inherit" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      {isError ? "✕" : "✓"} {alertMessage}
    </Alert>
  );
}

export default AlertBox;