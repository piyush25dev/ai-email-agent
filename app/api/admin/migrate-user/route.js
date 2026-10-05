import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const OLD_USER_ID = "test-user-001";

async function copyCollection(sourceRef, destinationRef) {
  const snapshot = await sourceRef.get();

  if (snapshot.empty) {
    return 0;
  }

  let copied = 0;

  for (const doc of snapshot.docs) {
    const destinationDoc = destinationRef.doc(doc.id);

    await destinationDoc.set(doc.data(), { merge: true });

    copied++;

    // Copy nested subcollections if any exist
    const nestedCollections = await doc.ref.listCollections();

    for (const nestedCollection of nestedCollections) {
      await copyCollection(
        nestedCollection,
        destinationDoc.collection(nestedCollection.id)
      );
    }
  }

  return copied;
}

export async function POST(request) {
  try {
    // Only allow this temporary migration endpoint during development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          message: "Migration endpoint is disabled in production",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { newUserId } = body;

    if (!newUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "newUserId is required",
        },
        { status: 400 }
      );
    }

    if (newUserId === OLD_USER_ID) {
      return NextResponse.json(
        {
          success: false,
          message: "New user ID cannot be the old test user ID",
        },
        { status: 400 }
      );
    }

    const oldUserRef = adminDb
      .collection("users")
      .doc(OLD_USER_ID);

    const newUserRef = adminDb
      .collection("users")
      .doc(newUserId);

    const collections = await oldUserRef.listCollections();

    const migratedCollections = {};
    let totalDocuments = 0;

    for (const collection of collections) {
      const count = await copyCollection(
        collection,
        newUserRef.collection(collection.id)
      );

      migratedCollections[collection.id] = count;
      totalDocuments += count;
    }

    return NextResponse.json({
      success: true,
      message: "User data migrated successfully",
      oldUserId: OLD_USER_ID,
      newUserId,
      totalDocuments,
      migratedCollections,
    });
  } catch (error) {
    console.error("User migration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Migration failed",
      },
      { status: 500 }
    );
  }
}