import { sendEmail } from "@/services/gmailService";

export async function sendLeaveApprovalEmail({
  userId,
  managerEmail,
  leaveRequest,
}) {
  if (!managerEmail) {
    throw new Error("Manager email is required for leave approval notification");
  }

  if (!leaveRequest?.id) {
    throw new Error("Leave request is required");
  }

  const {
    id,
    employeeName,
    employeeEmail,
    startDate,
    endDate,
    numberOfDays,
    reason,
  } = leaveRequest;

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const dashboardUrl = `${appUrl}/dashboard/approvals`;

  const subject = `Leave Request - ${employeeName}`;

  const message = `Hi Manager,

A new leave request has been submitted and requires your approval.

Employee:
${employeeName} (${employeeEmail})

Leave Details:
Start Date: ${startDate}
End Date: ${endDate}
Number of Days: ${numberOfDays}
Reason: ${reason}

Please review this leave request from your dashboard:
${dashboardUrl}

Leave Request ID: ${id}

Regards,
AI Email Agent`;

  const html = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Leave Request - ${employeeName}</h2>

    <p>Hi Manager,</p>

    <p>
      A new leave request has been submitted and requires your approval.
    </p>

    <h3>Employee Details</h3>

    <p>
      <strong>Name:</strong> ${employeeName}<br />
      <strong>Email:</strong> ${employeeEmail}
    </p>

    <h3>Leave Details</h3>

    <p>
      <strong>Start Date:</strong> ${startDate}<br />
      <strong>End Date:</strong> ${endDate}<br />
      <strong>Number of Days:</strong> ${numberOfDays}<br />
      <strong>Reason:</strong> ${reason}
    </p>

    <p style="margin-top: 30px;">
      <a
        href="${dashboardUrl}"
        style="
          display: inline-block;
          padding: 12px 22px;
          background: #674d9f;
          color: white;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Review Leave Request
      </a>
    </p>

    <p style="margin-top: 30px;">
      <strong>Leave Request ID:</strong> ${id}
    </p>

    <p>
      Regards,<br />
      AI Email Agent
    </p>
  </body>
</html>
`;

  return sendEmail({
    userId,
    to: managerEmail,
    subject,
    message,
    html,
  });
}