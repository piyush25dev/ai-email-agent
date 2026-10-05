import { Box, Chip, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

/**
 * Render approval status chip
 */
export function renderStatus(status) {
  if (status === "APPROVED") {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Approved"
        color="success"
        size="small"
      />
    );
  }

  if (status === "REJECTED") {
    return (
      <Chip
        icon={<CancelOutlinedIcon />}
        label="Rejected"
        color="error"
        size="small"
      />
    );
  }

  return (
    <Chip
      icon={<PendingActionsOutlinedIcon />}
      label="Pending"
      color="warning"
      size="small"
    />
  );
}

/**
 * Render leave balance information
 */
export function renderLeaveBalance(request) {
  const available = request.availableLeaveBalance ?? 0;
  const requested = request.requestedLeaveDays ?? request.numberOfDays ?? 0;
  const isInsufficient =
    request.balanceStatus === "INSUFFICIENT" || request.balanceAvailable === false;
  const isSufficient =
    request.balanceStatus === "SUFFICIENT" || request.balanceAvailable === true;

  if (isInsufficient) {
    return (
      <Box sx={{ minWidth: 150 }}>
        <Chip
          icon={<WarningAmberOutlinedIcon />}
          label="Insufficient"
          color="error"
          size="small"
          sx={{ mb: 0.75 }}
        />

        <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          Available: <strong>{available} day(s)</strong>
        </Typography>

        <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          Requested: <strong>{requested} day(s)</strong>
        </Typography>

        {request.balanceReason && (
          <Typography sx={{ mt: 0.5, fontSize: 11, color: "#b91c1c" }}>
            {request.balanceReason}
          </Typography>
        )}
      </Box>
    );
  }

  if (isSufficient) {
    return (
      <Box sx={{ minWidth: 130 }}>
        <Chip
          label="Sufficient"
          color="success"
          size="small"
          variant="outlined"
          sx={{ mb: 0.75 }}
        />

        <Typography sx={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          Available: <strong>{available} day(s)</strong>
        </Typography>

        <Typography sx={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
          Requested: {requested} day(s)
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 120 }}>
      <Chip
        label="Not available"
        color="default"
        size="small"
        variant="outlined"
        sx={{ mb: 0.75 }}
      />

      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
        Balance data unavailable
      </Typography>
    </Box>
  );
}

/**
 * Render leave deduction status
 */
export function renderDeduction(request) {
  if (request.balanceDeducted) {
    return (
      <Box>
        <Chip
          label={`${request.deductedDays || 0} day(s) deducted`}
          color="success"
          size="small"
          variant="outlined"
        />

        <Typography sx={{ mt: 0.5, fontSize: 12, color: "#6b7280" }}>
          Remaining: {request.remainingLeaveBalance ?? 0}
        </Typography>
      </Box>
    );
  }

  if (request.status === "REJECTED") {
    return (
      <Chip
        label="Not deducted"
        color="error"
        size="small"
        variant="outlined"
      />
    );
  }

  if (request.balanceStatus === "INSUFFICIENT") {
    return (
      <Chip
        label="Awaiting approval"
        color="warning"
        size="small"
        variant="outlined"
      />
    );
  }

  return (
    <Chip
      label="Not deducted"
      color="default"
      size="small"
      variant="outlined"
    />
  );
}

/**
 * Check if balance is insufficient
 */
export function isBalanceInsufficient(request) {
  return (
    request.balanceStatus === "INSUFFICIENT" || request.balanceAvailable === false
  );
}