import { NextResponse } from "next/server";
import { processEmail } from "../../../../../services/emailProcessor";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      sender,
      subject,
      body: emailBody,
    } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!sender || !subject || !emailBody) {
      return NextResponse.json(
        {
          success: false,
          message: "sender, subject and body are required",
        },
        {
          status: 400,
        }
      );
    }

    const result = await processEmail({
      userId,
      sender,
      subject,
      body: emailBody,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("EMAIL PROCESSING ERROR:", error);

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