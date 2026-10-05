import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function waitForAuthUser() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();

                if (!user) {
                    reject(new Error("User is not authenticated"));
                    return;
                }

                resolve(user);
            },
            (error) => {
                unsubscribe();
                reject(error);
            }
        );
    });
}

export async function getAuthHeaders() {
    const user = await waitForAuthUser();

    const token = await user.getIdToken();

    return {
        Authorization: `Bearer ${token}`,
    };
}