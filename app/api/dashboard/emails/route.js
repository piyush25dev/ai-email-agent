import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyUser } from "@/lib/authServer";

export const runtime = "nodejs";

// ==========================================
// EXTRACT EMAIL ADDRESS FROM SENDER
// ==========================================

function extractEmailAddress(sender) {
    if (!sender) {
        return "";
    }

    const value = String(sender).trim().toLowerCase();

    // Example:
    // Rahul <rahul@example.com>
    const angleMatch = value.match(/<([^>]+)>/);

    if (angleMatch?.[1]) {
        return angleMatch[1].trim().toLowerCase();
    }

    // Example:
    // rahul@example.com
    const emailMatch = value.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    if (emailMatch?.[0]) {
        return emailMatch[0].trim().toLowerCase();
    }

    return value;
}

// ==========================================
// CONVERT FIRESTORE DATE
// ==========================================

function convertDate(value) {
    if (!value) {
        return null;
    }

    try {
        if (typeof value.toDate === "function") {
            return value.toDate().toISOString();
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === "string") {
            return value;
        }

        if (typeof value === "number") {
            return new Date(value).toISOString();
        }

        if (value._seconds) {
            return new Date(
                value._seconds * 1000
            ).toISOString();
        }

        return value;
    } catch (error) {
        console.error("Date conversion error:", error);
        return null;
    }
}

// ==========================================
// GET EMAILS
// ==========================================

export async function GET(request) {
    try {
        // ==========================================
        // VERIFY FIREBASE USER
        // ==========================================

        const user = await verifyUser(request);

        const userRef = adminDb
            .collection("users")
            .doc(user.uid);

        // ==========================================
        // GET LIMIT
        // ==========================================

        const { searchParams } = new URL(request.url);

        const requestedLimit =
            Number(searchParams.get("limit")) || 50;

        const limit = Math.min(
            Math.max(requestedLimit, 1),
            100
        );

        // ==========================================
        // FETCH EMPLOYEES
        // ==========================================

        const employeesSnapshot = await userRef
            .collection("employees")
            .get();

        // ==========================================
        // CREATE EMPLOYEE EMAIL SET
        // ==========================================

        const employeeEmails = new Set();

        employeesSnapshot.forEach((doc) => {
            const employee = doc.data();

            if (employee.employeeEmail) {
                const employeeEmail = String(
                    employee.employeeEmail
                )
                    .trim()
                    .toLowerCase();

                if (employeeEmail) {
                    employeeEmails.add(employeeEmail);
                }
            }
        });

        console.log(
            `Employees found: ${employeeEmails.size}`
        );

        // ==========================================
        // IF NO EMPLOYEES EXIST
        // ==========================================

        if (employeeEmails.size === 0) {
            return NextResponse.json({
                success: true,
                count: 0,
                data: [],
                message:
                    "No employees are available in the database",
            });
        }

        // ==========================================
        // FETCH EMAILS
        // ==========================================

        const snapshot = await userRef
            .collection("emails")
            .get();

        // ==========================================
        // FILTER EMAILS BY EMPLOYEE EMAIL
        // ==========================================

        const filteredDocs = snapshot.docs
            .filter((doc) => {
                const data = doc.data();

                const senderEmail =
                    extractEmailAddress(data.sender);

                return employeeEmails.has(senderEmail);
            })
            .sort((a, b) => {
                const dateA =
                    convertDate(a.data().receivedAt);

                const dateB =
                    convertDate(b.data().receivedAt);

                const timestampA = dateA
                    ? new Date(dateA).getTime()
                    : 0;

                const timestampB = dateB
                    ? new Date(dateB).getTime()
                    : 0;

                return timestampB - timestampA;
            })
            .slice(0, limit);

        // ==========================================
        // FORMAT EMAILS
        // ==========================================

        const emails = filteredDocs.map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,

                gmailMessageId:
                    data.gmailMessageId || "",

                sender:
                    data.sender || "",

                subject:
                    data.subject || "(No subject)",

                body:
                    data.body || "",

                snippet:
                    data.snippet || "",

                receivedAt:
                    convertDate(data.receivedAt),

                analysis: data.analysis
                    ? {
                          intent:
                              data.analysis.intent || "",

                          category:
                              data.analysis.category || "",

                          confidence:
                              data.analysis.confidence ?? 0,

                          extractedData:
                              data.analysis
                                  .extractedData || {},

                          recommendedAction:
                              data.analysis
                                  .recommendedAction || "",
                      }
                    : null,
            };
        });

        // ==========================================
        // RESPONSE
        // ==========================================

        return NextResponse.json({
            success: true,
            count: emails.length,
            data: emails,
        });
    } catch (error) {
        console.error(
            "Dashboard emails error:",
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
                      "Failed to fetch emails",
            },
            {
                status: isUnauthorized ? 401 : 500,
            }
        );
    }
}