import { NextResponse } from "next/server";
import { createAccount } from "@/lib/auth/store";
import { createSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ message: "Enter a name between 2 and 60 characters." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 10 || password.length > 128) {
      return NextResponse.json({ message: "Use a password between 10 and 128 characters." }, { status: 400 });
    }

    const account = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    const created = await createAccount(account);
    if (!created) {
      return NextResponse.json(
        { message: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    await createSession(account);
    return NextResponse.json({ name, email }, { status: 201 });
  } catch (error) {
    console.error("Account registration failed", error);
    const message = error instanceof Error ? error.message : "Could not create the account. Please try again.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
