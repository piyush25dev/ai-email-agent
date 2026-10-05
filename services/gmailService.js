import { google } from "googleapis";
import { adminDb } from "@/lib/firebaseAdmin";
import { createGoogleOAuthClient } from "@/lib/gmail";

async function getIntegrationRef(userId) {
  return adminDb
    .collection("users")
    .doc(userId)
    .collection("integrations")
    .doc("google");
}

async function logEmailSent({
  userId,
  to,
  subject,
  gmailMessageId,
}) {
  try {
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("activityLogs")
      .add({
        type: "EMAIL_SENT",
        message: `Email sent to ${to}`,
        emailId: gmailMessageId || null,
        metadata: {
          recipient: to,
          subject,
          gmailMessageId: gmailMessageId || null,
        },
        createdAt: new Date(),
      });
  } catch (error) {
    console.error(
      "Failed to log sent email activity:",
      error
    );
  }
}

export async function getGmailClient(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const integrationRef = await getIntegrationRef(userId);
  const snapshot = await integrationRef.get();

  if (!snapshot.exists) {
    throw new Error(
      "Google account is not connected. Please connect Gmail again."
    );
  }

  const integration = snapshot.data();

  if (!integration.refreshToken) {
    throw new Error(
      "Google refresh token is missing. Please connect Gmail again."
    );
  }

  const oauth2Client = createGoogleOAuthClient();

  oauth2Client.setCredentials({
    access_token: integration.accessToken || undefined,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiryDate || undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    try {
      const updateData = {
        updatedAt: new Date(),
      };

      if (tokens.access_token) {
        updateData.accessToken = tokens.access_token;
      }

      if (tokens.expiry_date) {
        updateData.expiryDate = tokens.expiry_date;
      }

      if (tokens.refresh_token) {
        updateData.refreshToken = tokens.refresh_token;
      }

      await integrationRef.set(updateData, {
        merge: true,
      });
    } catch (error) {
      console.error(
        "Failed to save refreshed Google tokens:",
        error
      );
    }
  });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}

export async function sendEmail({
  userId,
  to,
  subject,
  message,
  html,
}) {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  const gmail = await getGmailClient(userId);

  const contentType = html
    ? "text/html; charset=utf-8"
    : "text/plain; charset=utf-8";

  const body = html || message || "";

  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: ${contentType}`,
    "",
    body,
  ].join("\r\n");

  const encodedMessage =
    Buffer.from(rawMessage).toString("base64url");

  try {
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    const sentEmail = response.data;

    await logEmailSent({
      userId,
      to,
      subject,
      gmailMessageId: sentEmail?.id || null,
    });

    return sentEmail;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "";

    if (
      errorMessage.toLowerCase().includes("invalid_grant")
    ) {
      throw new Error(
        "Google Gmail authorization has expired or been revoked. Please reconnect your Gmail account."
      );
    }

    throw error;
  }
}

function decodeBase64(data) {
  if (!data) {
    return "";
  }

  return Buffer.from(data, "base64url").toString("utf-8");
}

function extractEmailBody(payload) {
  if (!payload) {
    return "";
  }

  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  const parts = payload.parts || [];

  const plainTextPart = parts.find(
    (part) => part.mimeType === "text/plain"
  );

  if (plainTextPart?.body?.data) {
    return decodeBase64(plainTextPart.body.data);
  }

  for (const part of parts) {
    if (part.parts) {
      const nestedBody = extractEmailBody(part);

      if (nestedBody) {
        return nestedBody;
      }
    }
  }

  const htmlPart = parts.find(
    (part) => part.mimeType === "text/html"
  );

  if (htmlPart?.body?.data) {
    return decodeBase64(htmlPart.body.data);
  }

  return "";
}

export async function getEmailById(userId, messageId) {
  if (!messageId) {
    throw new Error("Gmail message ID is required");
  }

  const gmail = await getGmailClient(userId);

  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const email = response.data;
    const headers = email.payload?.headers || [];

    const getHeader = (name) =>
      headers.find(
        (header) =>
          header.name?.toLowerCase() === name.toLowerCase()
      )?.value || "";

    return {
      id: email.id,
      threadId: email.threadId,
      sender: getHeader("From"),
      subject: getHeader("Subject") || "(No subject)",
      date: getHeader("Date"),
      body: extractEmailBody(email.payload),
      snippet: email.snippet || "",
      labelIds: email.labelIds || [],
      internalDate: email.internalDate || null,
    };
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "";

    if (
      errorMessage.toLowerCase().includes("invalid_grant")
    ) {
      throw new Error(
        "Google Gmail authorization has expired or been revoked. Please reconnect your Gmail account."
      );
    }

    throw error;
  }
}

export async function getCurrentHistoryId(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const gmail = await getGmailClient(userId);

  try {
    const response = await gmail.users.getProfile({
      userId: "me",
    });

    return response.data.historyId;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "";

    if (
      errorMessage.toLowerCase().includes("invalid_grant")
    ) {
      throw new Error(
        "Google Gmail authorization has expired or been revoked. Please reconnect your Gmail account."
      );
    }

    throw error;
  }
}

export async function saveHistoryId(userId, historyId) {
  if (!historyId) {
    throw new Error("historyId is required");
  }

  const integrationRef = await getIntegrationRef(userId);

  await integrationRef.set(
    {
      historyId,
      updatedAt: new Date(),
    },
    {
      merge: true,
    }
  );
}

export async function getStoredHistoryId(userId) {
  const integrationRef = await getIntegrationRef(userId);
  const snapshot = await integrationRef.get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data()?.historyId || null;
}

const LEAVE_SUBJECT_KEYWORDS = [
  "leave request",
  "leave application",
  "leave approval",
  "sick leave",
  "casual leave",
  "annual leave",
  "vacation request",
  "holiday request",
];

export function isLeaveRelatedSubject(subject = "") {
  const normalizedSubject = String(subject)
    .toLowerCase()
    .trim();

  return LEAVE_SUBJECT_KEYWORDS.some((keyword) =>
    normalizedSubject.includes(keyword)
  );
}

export async function getNewGmailMessages(
  userId,
  startHistoryId
) {
  if (!startHistoryId) {
    throw new Error(
      "startHistoryId is required for incremental sync"
    );
  }

  const gmail = await getGmailClient(userId);
  const messageIds = new Set();

  let pageToken = undefined;

  try {
    do {
      const response =
        await gmail.users.history.list({
          userId: "me",
          startHistoryId,
          historyTypes: ["messageAdded"],
          maxResults: 100,
          pageToken,
        });

      const history = response.data.history || [];

      for (const historyItem of history) {
        const messagesAdded =
          historyItem.messagesAdded || [];

        for (const item of messagesAdded) {
          const message = item.message;

          if (!message?.id) {
            continue;
          }

          messageIds.add(message.id);
        }
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    return {
      messageIds: [...messageIds],
    };
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "";

    if (
      errorMessage.toLowerCase().includes("invalid_grant")
    ) {
      throw new Error(
        "Google Gmail authorization has expired or been revoked. Please reconnect your Gmail account."
      );
    }

    throw error;
  }
}

export async function getInitialGmailEmails(
  userId,
  maxResults = 100
) {
  const gmail = await getGmailClient(userId);

  try {
    const response =
      await gmail.users.messages.list({
        userId: "me",
        maxResults,
        labelIds: ["INBOX"],
      });

    const messages = response.data.messages || [];
    const emails = [];

    for (const message of messages) {
      try {
        const email = await getEmailById(
          userId,
          message.id
        );

        emails.push(email);
      } catch (error) {
        console.error(
          `Failed to retrieve Gmail message ${message.id}:`,
          error
        );
      }
    }

    return emails;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error_description ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "";

    if (
      errorMessage.toLowerCase().includes("invalid_grant")
    ) {
      throw new Error(
        "Google Gmail authorization has expired or been revoked. Please reconnect your Gmail account."
      );
    }

    throw error;
  }
}