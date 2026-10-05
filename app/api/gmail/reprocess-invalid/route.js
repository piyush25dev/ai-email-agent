import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";
import { processEmail } from "@/services/emailProcessor";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await verifyUser(request);

    const body = await request.json().catch(() => ({}));

    const limit = Math.min(
      Math.max(Number(body.limit) || 50, 1),
      100
    );

    const userRef = adminDb
      .collection("users")
      .doc(user.uid);

    /*
     * Find emails previously marked as invalid.
     */
    const activitySnapshot = await userRef
      .collection("activityLogs")
      .where("type", "==", "LEAVE_REQUEST_INVALID")
      .limit(limit)
      .get();

    const results = [];
    const processedEmailIds = new Set();

    for (const activityDoc of activitySnapshot.docs) {
      const activity = activityDoc.data();

      const firestoreEmailId =
        activity.emailId;

      if (!firestoreEmailId) {
        results.push({
          emailId: null,
          success: false,
          error:
            "Activity log does not contain emailId",
        });

        continue;
      }

      if (
        processedEmailIds.has(
          firestoreEmailId
        )
      ) {
        continue;
      }

      processedEmailIds.add(
        firestoreEmailId
      );

      try {
        /*
         * Get the actual Firestore email document.
         */
        const emailRef = userRef
          .collection("emails")
          .doc(firestoreEmailId);

        const emailSnapshot =
          await emailRef.get();

        if (!emailSnapshot.exists) {
          results.push({
            emailId: firestoreEmailId,
            success: false,
            error:
              "Email document not found",
          });

          continue;
        }

        const emailData =
          emailSnapshot.data();

        /*
         * IMPORTANT:
         * This is the Gmail ID, NOT the Firestore
         * document ID.
         */
        const gmailMessageId =
          emailData.gmailMessageId ||
          emailData.messageId ||
          null;

        if (!gmailMessageId) {
          results.push({
            emailId: firestoreEmailId,
            subject:
              emailData.subject || "",
            success: false,
            error:
              "Gmail message ID is missing from email document",
          });

          continue;
        }

        /*
         * Never create a second leave request.
         */
        const existingLeaveSnapshot =
          await userRef
            .collection("leaveRequests")
            .where(
              "emailId",
              "==",
              firestoreEmailId
            )
            .limit(1)
            .get();

        if (
          !existingLeaveSnapshot.empty
        ) {
          const leaveDoc =
            existingLeaveSnapshot.docs[0];

          results.push({
            emailId:
              firestoreEmailId,
            gmailMessageId,
            subject:
              emailData.subject || "",
            success: true,
            processed: false,
            skipped: true,
            reason:
              "Leave request already exists",
            leaveRequestId:
              leaveDoc.id,
          });

          continue;
        }

        /*
         * Reprocess the EXISTING email.
         * We do NOT call saveEmail here.
         */
        const result =
          await processEmail({
            userId: user.uid,
            email: {
              id: gmailMessageId,
              gmailMessageId,
              messageId:
                gmailMessageId,
              firestoreId:
                firestoreEmailId,
              sender:
                emailData.sender ||
                emailData.from ||
                "",
              from:
                emailData.from ||
                emailData.sender ||
                "",
              subject:
                emailData.subject || "",
              body:
                emailData.body || "",
              snippet:
                emailData.snippet || "",
              receivedAt:
                emailData.receivedAt ||
                emailData.date ||
                null,
              date:
                emailData.date ||
                emailData.receivedAt ||
                null,
              attachments:
                emailData.attachments ||
                [],
            },
            forceReprocess: true,
          });

        results.push({
          emailId:
            firestoreEmailId,
          gmailMessageId,
          subject:
            emailData.subject || "",
          result,
        });
      } catch (error) {
        console.error(
          `Failed to reprocess email ${firestoreEmailId}:`,
          error
        );

        results.push({
          emailId:
            firestoreEmailId,
          success: false,
          error:
            error?.message ||
            "Failed to reprocess email",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Invalid leave emails reprocessed",
      data: {
        found: activitySnapshot.size,
        processed: results.length,
        results,
      },
    });
  } catch (error) {
    console.error(
      "Reprocess invalid emails error:",
      error
    );

    const isUnauthorized =
      error.message === "Unauthorized" ||
      error.message ===
        "Missing authentication token" ||
      error.message ===
        "Invalid authentication token";

    return NextResponse.json(
      {
        success: false,
        message: isUnauthorized
          ? "Unauthorized"
          : error.message ||
            "Failed to reprocess invalid emails",
      },
      {
        status: isUnauthorized
          ? 401
          : 500,
      }
    );
  }
}