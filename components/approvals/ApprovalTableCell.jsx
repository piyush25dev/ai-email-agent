import { Box, Typography } from "@mui/material";

export default function ApprovalTableCell({ type, request }) {
  switch (type) {
    case "employee":
      return (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
            {request.employeeName}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
            {request.employeeEmail}
          </Typography>
        </Box>
      );

    case "leaveType":
      return (
        <Typography sx={{ fontSize: 13, textTransform: "capitalize" }}>
          {request.leaveType || "-"}
        </Typography>
      );

    case "dates":
      return (
        <Box>
          <Typography sx={{ fontSize: 13 }}>
            {request.startDate}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
            to {request.endDate}
          </Typography>
        </Box>
      );

    case "days":
      return (
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {request.numberOfDays}
        </Typography>
      );

    case "reason":
      return (
        <Typography
          sx={{
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={request.reason || ""}
        >
          {request.reason || "-"}
        </Typography>
      );

    default:
      return null;
  }
}