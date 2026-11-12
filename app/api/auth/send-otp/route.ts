import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailToUuid } from "@/lib/auth-utils";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().trim().toLowerCase().email("A valid email address is required."),
  fullName: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    const { email: cleanEmail, fullName } = parsed.data;

    const perIp = rateLimit(`otp-ip:${clientIp(request)}`, 10, 60 * 60_000);
    if (!perIp.ok) return tooMany(perIp.retryAfter, "Too many sign-up attempts from this network. Try again later.");
    const perEmail = rateLimit(`otp-email:${cleanEmail}`, 3, 10 * 60_000);
    if (!perEmail.ok) return tooMany(perEmail.retryAfter, "Too many codes requested for this e-mail. Wait a few minutes and try again.");
    const supabaseAdmin = createAdminClient();

    // 1. Check if email belongs to an already registered user in Supabase (auth.users / profiles)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("userid, email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
    }

    // Check listUsers in Supabase Auth as additional safety
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && usersData?.users) {
      const userExists = usersData.users.some(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (userExists) {
        return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
      }
    }

    // 2. Generate a 6-digit numeric OTP
    const token = randomInt(100000, 1000000).toString();
    const userId = emailToUuid(cleanEmail);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute expiration

    // 3. Delete old verification tokens for this user_id
    await supabaseAdmin.from("verification_tokens").delete().eq("user_id", userId);

    // 4. Store { token, user_id: emailToUuid(email), expires_at } in public.verification_tokens
    const { error: insertError } = await supabaseAdmin.from("verification_tokens").insert({
      user_id: userId,
      token: token,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Error inserting verification token:", insertError);
      return NextResponse.json({ error: "Failed to store verification token." }, { status: 500 });
    }

    // 5. Dispatch the 6-digit code via Mailjet API (v3.1)
    const mailjetApiKey = process.env.MAILJET_API_KEY;
    const mailjetSecretKey = process.env.MAILJET_SECRET_KEY;
    const senderEmail = process.env.MAILJET_SENDER_EMAIL;

    if (!mailjetApiKey || !mailjetSecretKey || !senderEmail) {
      console.error("Mailjet API credentials missing.");
      return NextResponse.json({ error: "Mailjet API configuration missing." }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString("base64")}`;

    const mailjetResponse = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: "Vision AI",
            },
            To: [
              {
                Email: cleanEmail,
                Name: fullName || cleanEmail,
              },
            ],
            Subject: "Your Vision AI Verification Code",
            TextPart: `Your verification code is: ${token}. This code will expire in 15 minutes.`,
            HTMLPart: `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #040406; color: #ffffff; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: #0c0c12; border: 1px solid #1e1e2d; border-radius: 16px; padding: 32px; text-align: center;">
                  <h2 style="color: #c6f24e; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin-top: 0; margin-bottom: 8px;">VisionAI</h2>
                  <p style="color: #a0a0b0; font-size: 14px; margin-bottom: 24px;">Pre-Signup Verification Code</p>
                  <p style="color: #e0e0e0; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Please enter the following 6-digit numeric OTP code to verify your email address and complete your signup:</p>
                  <div style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #ffffff; background: #141420; border: 1px solid #c6f24e40; padding: 16px 24px; border-radius: 12px; margin: 0 auto 24px auto; display: inline-block; box-shadow: 0 0 20px rgba(198, 242, 78, 0.15);">
                    ${token}
                  </div>
                  <p style="color: #666680; font-size: 12px; margin: 0;">This code is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this message.</p>
                </div>
              </div>
            `,
          },
        ],
      }),
    });

    if (!mailjetResponse.ok) {
      const errText = await mailjetResponse.text();
      console.error("Mailjet API dispatch error:", errText);
      return NextResponse.json({ error: "Failed to dispatch verification email via Mailjet." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification OTP code sent successfully.",
    });
  } catch (err: unknown) {
    console.error("Error in /api/auth/send-otp:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
