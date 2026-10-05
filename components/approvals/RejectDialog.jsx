import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, CircularProgress } from "@mui/material";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { isBalanceInsufficient } from "@/utils/approvalUtils";

export default function RejectDialog({
  open,
  onClose,
  selectedRequest,
  rejectionReason,
  onReasonChange,
  onReject,
  processing,
}) {
  if (!selectedRequest) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700, color: "#1f2937" }}>
        Reject Leave Request
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
            {selectedRequest.employeeName}
          </Typography>

          <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
            {selectedRequest.employeeEmail}
          </Typography>

          <Typography sx={{ mt: 1, fontSize: 13, color: "#6b7280" }}>
            {selectedRequest.leaveType || "Leave"} • {selectedRequest.startDate} to{" "}
            {selectedRequest.endDate}
          </Typography>

          {/* Balance warning */}
          {isBalanceInsufficient(selectedRequest) && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WarningAmberOutlinedIcon sx={{ fontSize: 20, color: "#dc2626" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#b91c1c" }}>
                  Insufficient leave balance
                </Typography>
              </Box>

              <Typography sx={{ mt: 0.5, fontSize: 12, color: "#7f1d1d" }}>
                Available: {selectedRequest.availableLeaveBalance ?? 0} day(s) • Requested:{" "}
                {selectedRequest.requestedLeaveDays ?? selectedRequest.numberOfDays ?? 0}{" "}
                day(s)
              </Typography>
            </Box>
          )}
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={4}
          label="Reason for rejection"
          placeholder="Enter the reason for rejecting this leave request..."
          value={rejectionReason}
          onChange={(e) => onReasonChange(e.target.value)}
          required
          inputProps={{ maxLength: 500 }}
          helperText={`${rejectionReason.length}/500`}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={onReject}
          disabled={!rejectionReason.trim() || processing}
          sx={{
            textTransform: "none",
            backgroundColor: "#d32f2f",
            "&:hover": { backgroundColor: "#b71c1c" },
          }}
        >
          {processing ? <CircularProgress size={18} color="inherit" /> : "Reject Leave"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}