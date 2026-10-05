import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export async function saveEmail({
  userId,
  gmailMessageId,
  sender,
  subject,
  body,
  receivedAt,
  snippet = "",
}) {
  const emailRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("emails")
    .doc();

  const emailData = {
    gmailMessageId,
    sender,
    subject,
    body,
    snippet,
    receivedAt,
  };

  await emailRef.set(emailData);

  return {
    id: emailRef.id,
    ...emailData,
  };
}

export async function updateEmailAnalysis({
  userId,
  emailId,
  analysis,
}) {
  const emailRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("emails")
    .doc(emailId);

  await emailRef.update({
    intent: analysis.intent,
    category: analysis.category,
    confidence: analysis.confidence,

    extractedData: analysis.extractedData,

    recommendedAction: analysis.recommendedAction,

    aiStatus: "PROCESSED",

    updatedAt: FieldValue.serverTimestamp(),
  });
}