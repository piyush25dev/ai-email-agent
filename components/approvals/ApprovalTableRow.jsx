import { Box, TableCell, TableRow, Typography } from "@mui/material";
import ApprovalTableCell from "./ApprovalTableCell";
import ApprovalTableActions from "./ApprovalTableActions";
import {
  renderStatus,
  renderLeaveBalance,
  renderDeduction,
} from "@/utils/approvalUtils";

export default function ApprovalTableRow({
  request,
  isProcessing,
  onApprove,
  onReject,
}) {
  return (
    <TableRow hover>
      {/* Employee */}
      <TableCell>
        <ApprovalTableCell type="employee" request={request} />
      </TableCell>

      {/* Leave Type */}
      <TableCell>
        <ApprovalTableCell type="leaveType" request={request} />
      </TableCell>

      {/* Dates */}
      <TableCell>
        <ApprovalTableCell type="dates" request={request} />
      </TableCell>

      {/* Days */}
      <TableCell align="center">
        <ApprovalTableCell type="days" request={request} />
      </TableCell>

      {/* Leave Balance */}
      <TableCell>
        {renderLeaveBalance(request)}
      </TableCell>

      {/* Reason */}
      <TableCell sx={{ maxWidth: 250 }}>
        <ApprovalTableCell type="reason" request={request} />
      </TableCell>

      {/* Status */}
      <TableCell>
        {renderStatus(request.status)}
      </TableCell>

      {/* Deduction */}
      <TableCell>
        {renderDeduction(request)}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <ApprovalTableActions
          request={request}
          isProcessing={isProcessing}
          onApprove={onApprove}
          onReject={onReject}
        />
      </TableCell>
    </TableRow>
  );
}