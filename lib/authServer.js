import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function verifyAuthToken(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing authentication token");
  }

  const idToken = authorization.substring("Bearer ".length).trim();

  if (!idToken) {
    throw new Error("Invalid authentication token");
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    };
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    throw new Error("Unauthorized");
  }
}

export async function verifyUser(request) {
  const user = await verifyAuthToken(request);

  const userRef = adminDb.collection("users").doc(user.uid);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    await userRef.set(
      {
        email: user.email || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  return user;
}