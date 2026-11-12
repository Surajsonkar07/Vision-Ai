import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailToUuid } from "@/lib/auth-utils";
import { z } from "zod";

const Body = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
  fullName: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Email, code and password are required." },
        { status: 400 }
      );
    }
    const { email: cleanEmail, code, password, fullName } = parsed.data;
    const userId = emailToUuid(cleanEmail);
    const supabaseAdmin = createAdminClient();

    // 1. Look up token in public.verification_tokens where user_id = emailToUuid(email) AND token = code
    const { data: tokenRecord, error: tokenQueryError } = await supabaseAdmin
      .from("verification_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("token", code)
      .maybeSingle();

    if (tokenQueryError || !tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Check expiration timestamp
    const isExpired = new Date(tokenRecord.expires_at).getTime() < Date.now();
    if (isExpired) {
      // Clean up expired token
      await supabaseAdmin.from("verification_tokens").delete().eq("user_id", userId);
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 2. Verification succeeded -> Create user in Supabase Auth using Service Role client
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "",
      },
    });

    if (createUserError || !authData.user) {
      console.error("Error creating user via admin:", createUserError);
      return NextResponse.json(
        { error: createUserError?.message || "Failed to create user account." },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // 3. Upsert into public.profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          userid: newUserId,
          full_name: fullName || "",
          email: cleanEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "userid" }
      );

    if (profileError) {
      console.warn("Profile upsert warning:", profileError.message);
    }

    // 4. Delete the used token from verification_tokens
    await supabaseAdmin.from("verification_tokens").delete().eq("user_id", userId);

    return NextResponse.json({
      success: true,
      message: "Email verified and user account created successfully.",
      user: {
        id: newUserId,
        email: cleanEmail,
      },
    });
  } catch (err: unknown) {
    console.error("Error in /api/auth/verify-email:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
