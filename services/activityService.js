import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../lib/firebaseAdmin";

export async function createActivityLog({
  userId,
  type,
  message,
  emailId = null,
  metadata = {},
}) {
  const activityRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("activityLogs")
    .doc();

  await activityRef.set({
    type,
    message,
    emailId,
    metadata,

    createdAt: FieldValue.serverTimestamp(),
  });

  return activityRef.id;
}