import { sendEmail } from "@/services/gmailService";

export function buildLeaveDecisionEmail({
  employeeName,
  status,
  startDate,
  endDate,
  numberOfDays,
  reason,
}) {
  const approved = status === "APPROVED";

  const subject = approved
    ? "Leave Request Approved"
    : "Leave Request Rejected";

  const message = approved
    ? `Hi ${employeeName},

Your leave request has been approved.

Leave details:
Start Date: ${startDate}
End Date: ${endDate}
Number of Days: ${numberOfDays}
Reason: ${reason}

Regards,
HR Team`
    : `Hi ${employeeName},

Your leave request has been rejected.

Leave details:
Start Date: ${startDate}
End Date: ${endDate}
Number of Days: ${numberOfDays}
Reason: ${reason}

Regards,
HR Team`;

  return {
    subject,
    message,
  };
}

export async function sendLeaveDecisionEmail({
  userId,
  leaveRequest,
}) {
  const {
    employeeName,
    employeeEmail,
    status,
    startDate,
    endDate,
    numberOfDays,
    reason,
  } = leaveRequest;

  const { subject, message } = buildLeaveDecisionEmail({
    employeeName,
    status,
    startDate,
    endDate,
    numberOfDays,
    reason,
  });

  return sendEmail({
    userId,
    to: employeeEmail,
    subject,
    message,
  });
}