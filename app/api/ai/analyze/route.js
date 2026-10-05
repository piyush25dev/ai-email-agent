import { NextResponse } from "next/server";
import { analyzeEmail } from "@/services/aiService";

export async function POST(request) {
  try {
    const email = await request.json();

    console.log("EMAIL RECEIVED:", email);

    const result = await analyzeEmail({
      sender: email.sender,
      subject: email.subject,
      body: email.body,
    });

    console.log("GEMINI RESULT:", result);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI ANALYSIS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}