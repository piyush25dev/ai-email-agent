import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

console.log("Firebase Admin config:", {
  projectId: process.env.FIREBASE_PROJECT_ID ? "YES" : "NO",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "YES" : "NO",
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? "YES" : "NO",
});

const adminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
};

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp(adminConfig);

export const adminDb = getFirestore(adminApp);