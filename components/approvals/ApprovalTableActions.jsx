import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { isBalanceInsufficient } from "@/utils/approvalUtils";

export default function ApprovalTableActions({
  request,
  isProcessing,
  onApprove,
  onReject,
}) {
  if (request.status !== "PENDING") {
    return (
      <Typography sx={{ fontSize: 12, color: "#9ca3af", }}>
        Completed
      </Typography>
    );
  }

  const isInsufficient = isBalanceInsufficient(request);

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, }}>
      {/* Approve Button */}
      <Button
        size="small"
        variant="contained"
        disabled={isProcessing}
        onClick={() => onApprove(request.id)}
        sx={{
          textTransform: "none",
          fontSize: "13px",
          fontWeight: 600,
          px: 2,
          py: 0.75,
          backgroundColor: "#2e7d32",
          color: "#ffffff",
          border: "1px solid #2e7d32",

          "&:hover": {
            backgroundColor: "#1b5e20",
            borderColor: "#1b5e20",
          },

          "&:disabled": {
            backgroundColor: "#ccc",
            color: "#666",
            opacity: 0.6,
          },
        }}
      >
        {isProcessing ? (
          <CircularProgress size={16} color="inherit" sx={{ mr: 0.5 }} />
        ) : (
          "Approve"
        )}
      </Button>

      {/* Reject Button */}
      <Button
        size="small"
        variant="outlined"
        disabled={isProcessing}
        onClick={() => onReject(request)}
        sx={{
          textTransform: "none",
          fontSize: "13px",
          fontWeight: 600,
          px: 2,
          py: 0.75,
          borderColor: "#d32f2f",
          color: "#d32f2f",
          border: "1px solid #d32f2f",

          "&:hover": {
            borderColor: "#b71c1c",
            backgroundColor: "rgba(211, 47, 47, 0.08)",
            color: "#b71c1c",
          },

          "&:disabled": {
            borderColor: "#ccc",
            color: "#ccc",
            opacity: 0.6,
          },
        }}
      >
        Reject
      </Button>

      {/* Balance Warning - shown below buttons if insufficient */}
      {isInsufficient && (
        <Typography
          sx={{
            width: "100%",
            mt: 0.5,
            fontSize: 11,
            color: "#b91c1c",
            textAlign: "right",
          }}
        >
          Balance insufficient — approval will re-check current balance
        </Typography>
      )}
    </Box>
  );
}