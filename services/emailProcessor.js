import { adminDb } from "@/lib/firebaseAdmin";
import { saveEmail } from "@/services/emailService";
import { analyzeEmail } from "@/services/aiService";
import { createLeaveRequest } from "@/services/leaveService";
import { createActivityLog } from "@/services/activityService";
import { sendLeaveApprovalEmail } from "@/services/managerNotificationService";
import { checkLeaveAvailability } from "@/services/leaveBalanceService";

const CONNECTED_EMAIL =
  process.env.GMAIL_CONNECTED_EMAIL ||
  "piyushdewangan2501@gmail.com";

function normalizeEmail(value = "") {
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : String(value)).trim().toLowerCase();
}

function getGmailMessageId(email) {
  return (
    email.gmailMessageId ||
    email.messageId ||
    email.id ||
    null
  );
}

async function findExistingEmail(emailsRef, gmailMessageId) {
  if (!gmailMessageId) return null;

  let snapshot = await emailsRef
    .where("gmailMessageId", "==", gmailMessageId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0];
  }

  snapshot = await emailsRef
    .where("messageId", "==", gmailMessageId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0];
  }

  return null;
}

async function saveAnalysis({
  userId,
  emailDoc,
  analysis,
  balanceCheck = undefined,
}) {
  const updateData = {
    analysis,
    updatedAt: new Date(),
  };

  if (balanceCheck !== undefined) {
    updateData.leaveBalanceCheck = balanceCheck;
  }

  await adminDb
    .collection("users")
    .doc(userId)
    .collection("emails")
    .doc(emailDoc.id)
    .update(updateData);
}

async function createInvalidActivity({
  userId,
  emailId,
  reason,
  extractedData = null,
}) {
  await createActivityLog({
    userId,
    type: "LEAVE_REQUEST_INVALID",
    message: reason,
    emailId,
    metadata: {
      reason,
      extractedData,
    },
  });
}

async function notifyManager({
  userId,
  leaveRequest,
  emailId,
}) {
  const managerEmail = process.env.MANAGER_EMAIL;

  if (!managerEmail) {
    console.warn("MANAGER_EMAIL is not configured");
    return leaveRequest;
  }

  if (leaveRequest.managerNotificationStatus === "SENT") {
    return leaveRequest;
  }

  const emailResult = await sendLeaveApprovalEmail({
    userId,
    managerEmail,
    leaveRequest,
  });

  await adminDb
    .collection("users")
    .doc(userId)
    .collection("leaveRequests")
    .doc(leaveRequest.id)
    .update({
      managerNotificationStatus: "SENT",
      managerNotificationEmailId: emailResult?.id || null,
      updatedAt: new Date(),
    });

  await createActivityLog({
    userId,
    type: "MANAGER_NOTIFIED",
    message: `Manager notified about leave request from ${leaveRequest.employeeName}`,
    emailId,
    metadata: {
      leaveRequestId: leaveRequest.id,
      managerEmail,
      notificationEmailId: emailResult?.id || null,
    },
  });

  return {
    ...leaveRequest,
    managerNotificationStatus: "SENT",
    managerNotificationEmailId: emailResult?.id || null,
  };
}

export async function processEmail({
  userId,
  email,
  forceReprocess = false,
}) {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!email) {
    throw new Error("email is required");
  }

  const gmailMessageId = getGmailMessageId(email);

  if (!gmailMessageId) {
    throw new Error("Gmail message ID is missing");
  }

  const sender =
    email.sender ||
    email.from ||
    "";

  const subject = email.subject || "";
  const body = email.body || "";
  const snippet = email.snippet || "";

  console.log("========================================");
  console.log("Processing Gmail message:", gmailMessageId);
  console.log("Subject:", subject);
  console.log("From:", sender);
  console.log("Force reprocess:", forceReprocess);
  console.log("========================================");

  try {
    const userRef = adminDb.collection("users").doc(userId);
    const emailsRef = userRef.collection("emails");

    const normalizedSender = normalizeEmail(sender);

    if (
      normalizedSender &&
      normalizedSender === CONNECTED_EMAIL.toLowerCase()
    ) {
      console.log(
        `Skipping email sent by connected account: ${sender}`
      );

      return {
        success: true,
        processed: false,
        skipped: true,
        reason: "EMAIL_SENT_BY_CONNECTED_ACCOUNT",
        gmailMessageId,
      };
    }

    let emailDoc = await findExistingEmail(
      emailsRef,
      gmailMessageId
    );

    let emailData;

    /*
     * =========================================================
     * EXISTING EMAIL
     * =========================================================
     */

    if (emailDoc) {
      emailData = emailDoc.data();

      console.log(
        `Existing email found: ${emailDoc.id}`
      );

      const existingLeaveSnapshot = await userRef
        .collection("leaveRequests")
        .where("emailId", "==", emailDoc.id)
        .limit(1)
        .get();

      if (
        !existingLeaveSnapshot.empty &&
        !forceReprocess
      ) {
        const leaveDoc =
          existingLeaveSnapshot.docs[0];

        return {
          success: true,
          processed: false,
          skipped: true,
          reason: "EMAIL_ALREADY_PROCESSED",
          emailId: emailDoc.id,
          gmailMessageId,
          leaveRequestId: leaveDoc.id,
        };
      }

      if (!forceReprocess && emailData.analysis) {
        console.log(
          "Existing analysis found. Using existing analysis."
        );
      }
    }

    /*
     * =========================================================
     * NEW EMAIL
     * =========================================================
     */

    if (!emailDoc) {
      emailData = {
        gmailMessageId,
        messageId: gmailMessageId,
        sender,
        from: sender,
        subject,
        body,
        snippet,
        receivedAt:
          email.receivedAt ||
          email.date ||
          null,
      };

      const savedEmail = await saveEmail({
        userId,
        gmailMessageId,
        sender,
        subject,
        body,
        receivedAt:
          email.receivedAt ||
          email.date ||
          null,
        snippet,
      });

      emailDoc = await emailsRef.doc(savedEmail.id).get();

      if (!emailDoc.exists) {
        throw new Error(
          "Email was saved but could not be read back"
        );
      }

      emailData = emailDoc.data();

      await createActivityLog({
        userId,
        type: "EMAIL_RECEIVED",
        message: `Received email: ${subject}`,
        emailId: emailDoc.id,
      });
    }

    /*
     * =========================================================
     * AI ANALYSIS
     * =========================================================
     */

    let analysis = emailData.analysis;

    if (!analysis || forceReprocess) {
      console.log(
        `Running AI analysis for Gmail message ${gmailMessageId}`
      );

      analysis = await analyzeEmail({
        sender:
          emailData.sender ||
          emailData.from ||
          sender,
        subject:
          emailData.subject ||
          subject,
        body:
          emailData.body ||
          body,
        attachments:
          emailData.attachments ||
          email.attachments ||
          [],
      });

      await saveAnalysis({
        userId,
        emailDoc,
        analysis,
      });

      await createActivityLog({
        userId,
        type: "AI_ANALYZED",
        message: `AI classified email as ${analysis.category}`,
        emailId: emailDoc.id,
        metadata: {
          intent: analysis.intent,
          category: analysis.category,
          confidence: analysis.confidence,
          recovered: forceReprocess,
        },
      });
    }

    /*
     * =========================================================
     * EXTRACTED DATA
     * =========================================================
     */

    const extractedData = analysis?.extractedData || {};

    const isLeaveRequest =
      analysis?.intent === "leave_request";

    if (!isLeaveRequest) {
      return {
        success: true,
        processed: true,
        skipped: false,
        reason: "NOT_A_LEAVE_REQUEST",
        emailId: emailDoc.id,
        gmailMessageId,
        analysis,
      };
    }

    /*
     * =========================================================
     * VALIDATE LEAVE INFORMATION
     * =========================================================
     */

    const missingFields = [];

    if (!extractedData.employeeName) {
      missingFields.push("employeeName");
    }

    if (!extractedData.employeeEmail) {
      missingFields.push("employeeEmail");
    }

    if (!extractedData.startDate) {
      missingFields.push("startDate");
    }

    if (!extractedData.endDate) {
      missingFields.push("endDate");
    }

    if (
      Number(extractedData.numberOfDays || 0) <= 0
    ) {
      missingFields.push("numberOfDays");
    }

    if (!extractedData.leaveType) {
      missingFields.push("leaveType");
    }

    if (missingFields.length) {
      const reason =
        `Leave request has incomplete information: ${missingFields.join(", ")}`;

      console.log(reason);

      await createInvalidActivity({
        userId,
        emailId: emailDoc.id,
        reason,
        extractedData,
      });

      return {
        success: false,
        processed: false,
        skipped: true,
        reason: "INCOMPLETE_LEAVE_INFORMATION",
        missingFields,
        emailId: emailDoc.id,
        gmailMessageId,
        analysis,
      };
    }

    /*
     * =========================================================
     * CHECK EMPLOYEE LEAVE BALANCE
     * =========================================================
     */

    const balanceCheck =
      await checkLeaveAvailability({
        userId,
        employeeEmail:
          extractedData.employeeEmail,
        leaveType:
          extractedData.leaveType,
        numberOfDays:
          extractedData.numberOfDays,
      });

    console.log(
      "Leave balance check:",
      balanceCheck
    );

    await saveAnalysis({
      userId,
      emailDoc,
      analysis,
      balanceCheck,
    });

    /*
     * =========================================================
     * EMPLOYEE NOT FOUND
     * =========================================================
     */

    if (!balanceCheck.employeeFound) {
      const reason =
        balanceCheck.reason ||
        "Employee not found";

      await createActivityLog({
        userId,
        type: "LEAVE_VALIDATION_FAILED",
        message: reason,
        emailId: emailDoc.id,
        metadata: {
          employeeEmail:
            extractedData.employeeEmail,
          reason,
        },
      });

      return {
        success: false,
        processed: false,
        skipped: true,
        reason: "EMPLOYEE_NOT_FOUND",
        emailId: emailDoc.id,
        gmailMessageId,
        analysis,
        leaveBalanceCheck: balanceCheck,
      };
    }

    /*
     * =========================================================
     * INSUFFICIENT BALANCE
     * =========================================================
     */

    if (!balanceCheck.available) {
      const reason =
        balanceCheck.reason ||
        "Insufficient leave balance";

      await createActivityLog({
        userId,
        type: "LEAVE_BALANCE_INSUFFICIENT",
        message: `Insufficient leave balance for ${extractedData.employeeName}`,
        emailId: emailDoc.id,
        metadata: {
          employeeName:
            extractedData.employeeName,
          employeeEmail:
            extractedData.employeeEmail,
          leaveType:
            balanceCheck.leaveType,
          requestedDays:
            balanceCheck.requestedDays,
          availableDays:
            balanceCheck.availableDays,
          reason,
        },
      });

      return {
        success: false,
        processed: false,
        skipped: true,
        reason: "INSUFFICIENT_LEAVE_BALANCE",
        emailId: emailDoc.id,
        gmailMessageId,
        analysis,
        leaveBalanceCheck: balanceCheck,
      };
    }

    /*
     * =========================================================
     * CHECK DUPLICATE LEAVE REQUEST
     * =========================================================
     */

    const existingLeaveSnapshot = await userRef
      .collection("leaveRequests")
      .where("emailId", "==", emailDoc.id)
      .limit(1)
      .get();

    if (!existingLeaveSnapshot.empty) {
      const leaveDoc =
        existingLeaveSnapshot.docs[0];

      return {
        success: true,
        processed: false,
        skipped: true,
        reason: "LEAVE_REQUEST_ALREADY_EXISTS",
        emailId: emailDoc.id,
        gmailMessageId,
        leaveRequestId: leaveDoc.id,
      };
    }

    /*
     * =========================================================
     * CREATE LEAVE REQUEST
     * =========================================================
     */

    const leaveRequest =
      await createLeaveRequest({
        userId,
        emailId: emailDoc.id,
        extractedData: {
          ...extractedData,
          leaveType:
            balanceCheck.leaveType ||
            extractedData.leaveType,
        },
        employeeRecordId:
          balanceCheck.employee?.employeeId ||
          null,
        balanceCheck,
      });

    await createActivityLog({
      userId,
      type: "LEAVE_REQUEST_CREATED",
      message: `Leave request created for ${extractedData.employeeName}`,
      emailId: emailDoc.id,
      metadata: {
        leaveRequestId: leaveRequest.id,
        leaveType: balanceCheck.leaveType,
        requestedDays:
          balanceCheck.requestedDays,
        availableDays:
          balanceCheck.availableDays,
        remainingDays:
          balanceCheck.remainingDays,
        recovered: forceReprocess,
      },
    });

    /*
     * =========================================================
     * NOTIFY MANAGER
     * =========================================================
     */

    const updatedLeaveRequest =
      await notifyManager({
        userId,
        leaveRequest,
        emailId: emailDoc.id,
      });

    return {
      success: true,
      processed: true,
      skipped: false,
      emailId: emailDoc.id,
      gmailMessageId,
      analysis,
      leaveBalanceCheck: balanceCheck,
      leaveRequest: updatedLeaveRequest,
    };
  } catch (error) {
    console.error(
      `Email processing failed for ${gmailMessageId}:`,
      error
    );

    return {
      success: false,
      processed: false,
      skipped: false,
      gmailMessageId,
      error:
        error?.message ||
        "Email processing failed",
    };
  }
}