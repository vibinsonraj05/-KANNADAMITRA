import { NextResponse } from "next/server";
import { findAccount } from "@/lib/auth/store";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ message: "Enter your email address and password." }, { status: 400 });
    }

    const account = await findAccount(email);
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }

    await createSession(account);
    return NextResponse.json({ name: account.name, email: account.email });
  } catch (error) {
    console.error("Sign in failed", error);
    const message = error instanceof Error ? error.message : "Could not sign in. Please try again.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
