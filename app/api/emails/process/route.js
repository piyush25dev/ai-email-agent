import { NextResponse } from "next/server";
import { processEmail } from "../../../../services/emailProcessor";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      userId,
      email,
      forceReprocess = false,
    } = body;

    // =====================================================
    // VALIDATE USER
    // =====================================================

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

    // =====================================================
    // VALIDATE EMAIL OBJECT
    // =====================================================

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "email is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!email.id) {
      return NextResponse.json(
        {
          success: false,
          message: "email.id is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!email.from) {
      return NextResponse.json(
        {
          success: false,
          message: "email.from is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!email.subject) {
      return NextResponse.json(
        {
          success: false,
          message: "email.subject is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!email.body) {
      return NextResponse.json(
        {
          success: false,
          message: "email.body is required",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // PROCESS EMAIL
    // =====================================================

    console.log("========================================");
    console.log("PROCESS EMAIL API");
    console.log("User ID:", userId);
    console.log("Email ID:", email.id);
    console.log("From:", email.from);
    console.log("Subject:", email.subject);
    console.log("Force Reprocess:", forceReprocess);
    console.log("========================================");

    const result = await processEmail({
      userId,
      email,
      forceReprocess,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "========================================"
    );
    console.error("EMAIL PROCESSING API ERROR");
    console.error(
      "========================================"
    );
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to process email",
      },
      {
        status: 500,
      }
    );
  }
}