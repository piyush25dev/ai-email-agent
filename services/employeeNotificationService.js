import { sendEmail } from "@/services/gmailService";
import { generateLeaveResponse } from "@/services/aiService";

export async function sendLeaveRejectionEmail({
    userId,
    leaveRequest,
    rejectionReason,
}) {
    const employeeEmail = String(
        leaveRequest?.employeeEmail || ""
    ).trim();

    if (!employeeEmail) {
        throw new Error("Employee email is missing");
    }

    const employeeName =
        leaveRequest.employeeName || employeeEmail;

    const reason = String(rejectionReason || "").trim();

    if (!reason) {
        throw new Error("Rejection reason is required");
    }

    let subject = "Leave Request Rejected";
    let message = `Hi ${employeeName},

Your leave request has been rejected.

Leave Type: ${leaveRequest.leaveType || "-"}
Start Date: ${leaveRequest.startDate || "-"}
End Date: ${leaveRequest.endDate || "-"}
Number of Days: ${leaveRequest.numberOfDays || 0}

Reason for rejection:
${reason}

Please contact your manager if you need any clarification.

Regards,
AI Email Agent`;

    let html = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2>Leave Request Rejected</h2>

    <p>Hi ${employeeName},</p>

    <p>Your leave request has been rejected.</p>

    <h3>Leave Details</h3>

    <p>
      <strong>Leave Type:</strong> ${leaveRequest.leaveType || "-"}<br />
      <strong>Start Date:</strong> ${leaveRequest.startDate || "-"}<br />
      <strong>End Date:</strong> ${leaveRequest.endDate || "-"}<br />
      <strong>Number of Days:</strong> ${leaveRequest.numberOfDays || 0}
    </p>

    <h3>Reason for Rejection</h3>

    <p>${reason}</p>

    <p>Please contact your manager if you need any clarification.</p>

    <p>
      Regards,<br />
      AI Email Agent
    </p>
  </body>
</html>
`;

    try {
        const aiResponse = await generateLeaveResponse({
            employeeName,
            employeeEmail,
            leaveType: leaveRequest.leaveType,
            startDate: leaveRequest.startDate,
            endDate: leaveRequest.endDate,
            numberOfDays: leaveRequest.numberOfDays,
            employeeReason: leaveRequest.reason,
            status: "REJECTED",
            rejectionReason: reason,
        });

        if (aiResponse?.subject && aiResponse?.message) {
            subject = aiResponse.subject;
            message = aiResponse.message;
            html = aiResponse.html || html;
        }
    } catch (error) {
        console.warn(
            "AI rejection email unavailable. Using fallback email:",
            error.message
        );
    }

    return sendEmail({
        userId,
        to: employeeEmail,
        subject,
        message,
        html,
    });
}