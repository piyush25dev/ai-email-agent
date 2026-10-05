import {
    getNewGmailMessages,
    getEmailById,
    getInitialGmailEmails,
    getCurrentHistoryId,
    getStoredHistoryId,
    saveHistoryId,
} from "@/services/gmailService";

import { processEmail } from "@/services/emailProcessor";

export async function processRecentGmailEmails(
    userId,
    limit = 10
) {
    if (!userId) {
        throw new Error("userId is required");
    }

    const safeLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );

    const storedHistoryId =
        await getStoredHistoryId(userId);

    /**
     * ==========================================
     * INITIAL SYNC
     * ==========================================
     *
     * No stored historyId means this is the
     * first synchronization.
     *
     * Fetch existing Inbox emails.
     */
    if (!storedHistoryId) {
        console.log(
            "No Gmail historyId found. Performing initial sync..."
        );

        const emails =
            await getInitialGmailEmails(
                userId,
                safeLimit
            );

        const results = [];

        for (const email of emails) {
            try {
                console.log(
                    `Processing Gmail email: "${email.subject}"`
                );

                const result =
                    await processEmail({
                        userId,
                        email: {
                            id: email.id,
                            threadId: email.threadId,
                            from: email.sender,
                            subject: email.subject,
                            body: email.body,
                            date: email.date,
                            snippet: email.snippet,
                            labelIds: email.labelIds,
                            internalDate:
                                email.internalDate,
                        },
                    });

                results.push({
                    gmailMessageId: email.id,
                    subject: email.subject,
                    sender: email.sender,
                    success: true,
                    result,
                });
            } catch (error) {
                console.error(
                    `Failed to process Gmail message ${email.id}:`,
                    error
                );

                results.push({
                    gmailMessageId: email.id,
                    subject: email.subject,
                    sender: email.sender,
                    success: false,
                    error: error.message,
                });
            }
        }

        /**
         * Save history only AFTER all messages
         * have been processed.
         */
        const currentHistoryId =
            await getCurrentHistoryId(userId);

        await saveHistoryId(
            userId,
            currentHistoryId
        );

        return {
            mode: "initial",
            found: emails.length,
            processed: results.length,
            results,
            historyId: currentHistoryId,
        };
    }

    /**
     * ==========================================
     * INCREMENTAL SYNC
     * ==========================================
     */

    console.log(
        `Running incremental Gmail sync from historyId ${storedHistoryId}`
    );

    try {
        const {
            messageIds,
        } = await getNewGmailMessages(
            userId,
            storedHistoryId
        );

        console.log(
            `Found ${messageIds.length} new Gmail messages`
        );

        /**
         * Respect requested limit.
         */
        const messagesToProcess =
            messageIds.slice(0, safeLimit);

        const results = [];

        for (const messageId of messagesToProcess) {
            try {
                const email =
                    await getEmailById(
                        userId,
                        messageId
                    );

                console.log(
                    `Processing Gmail email: "${email.subject}"`
                );

                const result =
                    await processEmail({
                        userId,
                        email: {
                            id: email.id,
                            threadId: email.threadId,
                            from: email.sender,
                            subject: email.subject,
                            body: email.body,
                            date: email.date,
                            snippet: email.snippet,
                            labelIds: email.labelIds,
                            internalDate:
                                email.internalDate,
                        },
                    });

                results.push({
                    gmailMessageId: email.id,
                    subject: email.subject,
                    sender: email.sender,
                    success: true,
                    result,
                });
            } catch (error) {
                console.error(
                    `Failed to process Gmail message ${messageId}:`,
                    error
                );

                results.push({
                    gmailMessageId: messageId,
                    success: false,
                    error: error.message,
                });
            }
        }

        /**
         * Get the newest history point AFTER
         * processing the messages.
         */
        const currentHistoryId =
            await getCurrentHistoryId(userId);

        await saveHistoryId(
            userId,
            currentHistoryId
        );

        return {
            mode: "incremental",
            found: messageIds.length,
            processed: results.length,
            results,
            historyId: currentHistoryId,
        };
    } catch (error) {
        /**
         * ==========================================
         * HISTORY RECOVERY
         * ==========================================
         */

        const errorMessage =
            error?.message || "";

        const historyExpired =
            errorMessage.includes("404") ||
            errorMessage.includes(
                "Requested entity was not found"
            );

        if (!historyExpired) {
            throw error;
        }

        console.warn(
            "Gmail history expired. Performing recovery sync..."
        );

        const emails =
            await getInitialGmailEmails(
                userId,
                safeLimit
            );

        const results = [];

        for (const email of emails) {
            try {
                console.log(
                    `Processing Gmail email: "${email.subject}"`
                );

                const result =
                    await processEmail({
                        userId,
                        email: {
                            id: email.id,
                            threadId: email.threadId,
                            from: email.sender,
                            subject: email.subject,
                            body: email.body,
                            date: email.date,
                            snippet: email.snippet,
                            labelIds: email.labelIds,
                            internalDate:
                                email.internalDate,
                        },
                    });

                results.push({
                    gmailMessageId: email.id,
                    subject: email.subject,
                    sender: email.sender,
                    success: true,
                    result,
                });
            } catch (processingError) {
                console.error(
                    `Failed to process Gmail message ${email.id}:`,
                    processingError
                );

                results.push({
                    gmailMessageId: email.id,
                    subject: email.subject,
                    sender: email.sender,
                    success: false,
                    error: processingError.message,
                });
            }
        }

        const currentHistoryId =
            await getCurrentHistoryId(userId);

        await saveHistoryId(
            userId,
            currentHistoryId
        );

        return {
            mode: "recovery",
            found: emails.length,
            processed: results.length,
            results,
            historyId: currentHistoryId,
        };
    }
}