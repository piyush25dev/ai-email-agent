import { callOpenRouter } from "@/lib/gemini";

function normalizeLeaveType(value = "") {
  const type = String(value).trim().toLowerCase();

  if (!type) return "";
  if (type.includes("casual") || type === "cl") return "casual";
  if (type.includes("sick") || type.includes("medical") || type === "sl") return "sick";
  if (
    type.includes("annual") ||
    type.includes("earned") ||
    type.includes("privilege") ||
    type.includes("vacation") ||
    type === "al"
  ) {
    return "annual";
  }

  return "";
}

function detectLeaveType(text = "") {
  const value = String(text).toLowerCase();

  if (
    value.includes("sick leave") ||
    value.includes("medical leave") ||
    value.includes("illness") ||
    value.includes("fever")
  ) {
    return "sick";
  }

  if (
    value.includes("annual leave") ||
    value.includes("earned leave") ||
    value.includes("privilege leave") ||
    value.includes("vacation leave")
  ) {
    return "annual";
  }

  if (value.includes("casual leave")) return "casual";

  return "";
}

function extractEmailAddress(value = "") {
  const text = String(value);

  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return match?.[0]?.trim().toLowerCase() || "";
}

function extractNameFromSender(sender = "") {
  const value = String(sender).trim();

  const match = value.match(/^"?([^"<]+)"?\s*<[^>]+>$/);

  if (match?.[1]) return match[1].trim();

  return "";
}

function extractNameFromBody(body = "") {
  const text = String(body).replace(/\r/g, "");

  const patterns = [
    /(?:regards|regard|thanks|thank you|best regards|sincerely)\s*[,:\-]?\s*\n?\s*([A-Za-z][A-Za-z .'-]{1,50})/i,
    /(?:employee\s*name|name)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{1,50})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function parseDate(value = "") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDate(date) {
  if (!date) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const days = Math.floor((end - start) / 86400000) + 1;

  return days > 0 ? days : 0;
}

function extractDates(text = "") {
  const value = String(text).replace(/\r/g, " ");

  const patterns = [
    /from\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+to\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i,
    /from\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+to\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /from\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+to\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (!match) continue;

    const start = parseDate(match[1]);
    const end = parseDate(match[2]);

    if (!start || !end) continue;

    const startDate = formatDate(start);
    const endDate = formatDate(end);

    return {
      startDate,
      endDate,
      numberOfDays: calculateDays(startDate, endDate),
    };
  }

  return {
    startDate: null,
    endDate: null,
    numberOfDays: 0,
  };
}

function extractReason(text = "") {
  const value = String(text).replace(/\r/g, "");

  const patterns = [
    /due to\s+(.+?)(?:\.|\n|regards|regard|thanks|thank you|$)/i,
    /because\s+(.+?)(?:\.|\n|regards|regard|thanks|thank you|$)/i,
    /reason\s*[:\-]\s*(.+?)(?:\.|\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match?.[1]) return match[1].trim();
  }

  return "";
}

function isLeaveSubject(subject = "") {
  const value = String(subject).toLowerCase();

  return [
    "leave request",
    "leave application",
    "leave approval",
    "leave",
    "vacation request",
    "sick leave",
    "casual leave",
    "annual leave",
    "holiday request",
  ].some((keyword) => value.includes(keyword));
}

function isLeaveContent(text = "") {
  const value = String(text).toLowerCase();

  return (
    value.includes("leave") ||
    value.includes("vacation") ||
    value.includes("day off") ||
    value.includes("time off") ||
    value.includes("holiday request")
  );
}

function extractDeterministicData({ sender = "", subject = "", body = "" }) {
  const combinedText = `${subject}\n${body}`;

  const employeeEmail = extractEmailAddress(sender);
  const senderName = extractNameFromSender(sender);
  const bodyName = extractNameFromBody(body);

  const employeeName = bodyName || senderName || "";
  const leaveType = detectLeaveType(combinedText);
  const dates = extractDates(combinedText);
  const reason = extractReason(body || combinedText);

  return {
    employeeName,
    employeeEmail,
    leaveType,
    startDate: dates.startDate,
    endDate: dates.endDate,
    numberOfDays: dates.numberOfDays,
    reason,
  };
}

function buildLeaveAnalysis(data) {
  return {
    intent: "leave_request",
    category: "Leave Requests",
    confidence: 0.98,
    extractedData: data,
    recommendedAction: data.leaveType
      ? "Check leave balance and request manager approval"
      : "Review leave type before requesting manager approval",
  };
}

function analyzeWithMockAI({ sender, subject, body }) {
  const combinedText = `${subject || ""}\n${body || ""}`;

  const isLeave =
    isLeaveSubject(subject) || isLeaveContent(combinedText);

  const data = extractDeterministicData({
    sender,
    subject,
    body,
  });

  if (isLeave) {
    return buildLeaveAnalysis(data);
  }

  return {
    intent: "general_enquiry",
    category: "General Enquiries",
    confidence: 0.7,
    extractedData: {
      employeeName: data.employeeName,
      employeeEmail: data.employeeEmail,
      leaveType: "",
      startDate: null,
      endDate: null,
      numberOfDays: 0,
      reason: "",
    },
    recommendedAction: "Review email",
  };
}

function cleanJsonResponse(content) {
  let value = String(content || "").trim();

  value = value
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    value = value.slice(firstBrace, lastBrace + 1);
  }

  return value;
}

function normalizeAnalysis(
  analysis,
  sender = "",
  subject = "",
  body = ""
) {
  const aiData = analysis?.extractedData || {};
  const deterministic = extractDeterministicData({
    sender,
    subject,
    body,
  });

  const intent = String(analysis?.intent || "")
    .trim()
    .toLowerCase();

  const category = String(analysis?.category || "");

  const isLeaveRequest =
    intent === "leave_request" ||
    intent === "leave request" ||
    category === "Leave Requests" ||
    intent.includes("leave") ||
    isLeaveSubject(subject) ||
    isLeaveContent(`${subject}\n${body}`);

  if (isLeaveRequest) {
    const employeeName =
      deterministic.employeeName ||
      aiData.employeeName ||
      extractNameFromSender(sender);

    const employeeEmail =
      deterministic.employeeEmail ||
      aiData.employeeEmail ||
      extractEmailAddress(sender);

    const leaveType =
      deterministic.leaveType ||
      normalizeLeaveType(aiData.leaveType);

    const startDate =
      deterministic.startDate ||
      aiData.startDate ||
      null;

    const endDate =
      deterministic.endDate ||
      aiData.endDate ||
      null;

    let numberOfDays = deterministic.numberOfDays;

    if (!numberOfDays && startDate && endDate) {
      numberOfDays = calculateDays(startDate, endDate);
    }

    if (!numberOfDays) {
      numberOfDays = Number(aiData.numberOfDays) || 0;
    }

    const reason =
      deterministic.reason ||
      aiData.reason ||
      "";

    return buildLeaveAnalysis({
      employeeName,
      employeeEmail,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
    });
  }

  return {
    intent: intent || "general_enquiry",
    category: category || "General Enquiries",
    confidence: Number(analysis?.confidence || 0),
    extractedData: {
      employeeName:
        aiData.employeeName ||
        deterministic.employeeName ||
        "",
      employeeEmail:
        aiData.employeeEmail ||
        deterministic.employeeEmail ||
        "",
      leaveType: "",
      startDate: null,
      endDate: null,
      numberOfDays: 0,
      reason: "",
    },
    recommendedAction:
      analysis?.recommendedAction || "Review email",
  };
}

async function analyzeWithOpenRouter({
  sender,
  subject,
  body,
}) {
  const prompt = `
You are an AI email classification and extraction system for an employee management application.

Analyze the email and return ONLY valid JSON.

Possible categories:
- Leave Requests
- Customer Support
- Sales Enquiries
- Interview Requests
- HR Requests
- Invoice/Payment Emails
- General Enquiries
- Other

For a leave request, extract:
- employeeName
- employeeEmail
- leaveType
- startDate
- endDate
- numberOfDays
- reason

Allowed leaveType values:
- casual
- sick
- annual

Important rules:
- Never invent a leave type.
- If leave type is not explicitly mentioned, return an empty string.
- If dates are explicitly provided, extract them exactly.
- Dates must be returned as YYYY-MM-DD.
- If both start and end dates are provided, numberOfDays must be the inclusive number of calendar days.
- Example: 2026-10-13 to 2026-10-15 = 3 days.
- "from 13 October 2026 to 15 October 2026" means startDate 2026-10-13 and endDate 2026-10-15.
- Do not use information from previous emails.
- Do not invent missing information.

Return exactly this JSON structure:

{
  "intent": "",
  "category": "",
  "confidence": 0,
  "extractedData": {
    "employeeName": "",
    "employeeEmail": "",
    "leaveType": "",
    "startDate": null,
    "endDate": null,
    "numberOfDays": 0,
    "reason": ""
  },
  "recommendedAction": ""
}

Email sender:
${sender || ""}

Email subject:
${subject || ""}

Email body:
${body || ""}
`;

  const content = await callOpenRouter({
    messages: [
      {
        role: "system",
        content:
          "You are a precise email classification and structured data extraction system. Return JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  });

  const json = cleanJsonResponse(content);

  let parsed;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    console.error("OpenRouter raw response:", content);

    throw new Error(
      `OpenRouter returned invalid JSON: ${error.message}`
    );
  }

  return normalizeAnalysis(
    parsed,
    sender,
    subject,
    body
  );
}

export async function analyzeEmail({
  sender = "",
  subject = "",
  body = "",
  attachments = [],
}) {
  const provider = (
    process.env.AI_PROVIDER || "openrouter"
  )
    .trim()
    .toLowerCase();

  console.log("========================================");
  console.log("AI EMAIL ANALYSIS");
  console.log("AI provider:", provider);
  console.log(
    "AI model:",
    process.env.OPENROUTER_MODEL || "openrouter/free"
  );
  console.log("Subject:", subject);
  console.log("From:", sender);
  console.log("========================================");

  if (provider === "mock") {
    return analyzeWithMockAI({
      sender,
      subject,
      body,
    });
  }

  if (provider !== "openrouter") {
    throw new Error(
      `Unsupported AI_PROVIDER: ${provider}. Use "openrouter" or "mock".`
    );
  }

  try {
    return await analyzeWithOpenRouter({
      sender,
      subject,
      body,
      attachments,
    });
  } catch (error) {
    console.error("OpenRouter analysis failed:", error);

    if (
      String(process.env.AI_FALLBACK_TO_MOCK).toLowerCase() ===
      "true"
    ) {
      console.log("Falling back to mock AI...");

      return analyzeWithMockAI({
        sender,
        subject,
        body,
      });
    }

    throw error;
  }
}

export async function generateLeaveResponse({
    employeeName = "",
    employeeEmail = "",
    leaveType = "",
    startDate = "",
    endDate = "",
    numberOfDays = 0,
    employeeReason = "",
    status,
    rejectionReason = "",
    remainingLeaveBalance = null,
}) {
    const decision =
        String(status || "").toUpperCase() === "APPROVED"
            ? "approved"
            : "rejected";

    const prompt = `
You are an AI email response generator for an employee leave management system.

Generate a professional, concise email to the employee about their leave request.

The manager has already made the final decision.
You must NOT change, question, or invent the decision.

Decision: ${decision}

Employee:
Name: ${employeeName}
Email: ${employeeEmail}

Leave details:
Leave Type: ${leaveType}
Start Date: ${startDate}
End Date: ${endDate}
Number of Days: ${numberOfDays}
Employee Reason: ${employeeReason}

${
    decision === "approved"
        ? `Remaining Leave Balance: ${
              remainingLeaveBalance ?? "Not available"
          }`
        : `Manager's Rejection Reason: ${rejectionReason}`
}

Rules:
- Address the employee by name.
- Clearly communicate whether the leave was approved or rejected.
- Include the important leave dates and number of days.
- For rejection, clearly and professionally communicate the manager's rejection reason.
- For approval, mention the remaining leave balance when provided.
- Do not invent information.
- Do not mention AI, prompts, or internal systems.
- Keep the email professional and concise.
- Return ONLY valid JSON.

Return exactly:
{
  "subject": "",
  "message": "",
  "html": ""
}
`;

    const content = await callOpenRouter({
        messages: [
            {
                role: "system",
                content:
                    "You generate professional employee emails. Return JSON only.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.3,
    });

    const json = cleanJsonResponse(content);

    let result;

    try {
        result = JSON.parse(json);
    } catch (error) {
        console.error("AI response generation failed:", content);
        throw new Error(
            `AI returned invalid response JSON: ${error.message}`
        );
    }

    if (
        !result?.subject ||
        !result?.message
    ) {
        throw new Error("AI generated an incomplete email response");
    }

    return {
        subject: String(result.subject).trim(),
        message: String(result.message).trim(),
        html: String(result.html || "").trim(),
    };
}