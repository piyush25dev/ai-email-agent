import { adminDb } from "@/lib/firebaseAdmin";

export async function requireManager(userId) {
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const userRef = adminDb
        .collection("users")
        .doc(userId);

    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
        throw new Error("User profile not found");
    }

    const userData = userSnapshot.data();

    const role = String(userData.role || "")
        .trim()
        .toLowerCase();

    if (role !== "manager" && role !== "admin") {
        const error = new Error(
            "Manager authorization required"
        );

        error.code = "FORBIDDEN";

        throw error;
    }

    return {
        userId,
        role,
    };
}