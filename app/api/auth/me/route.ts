import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
export async function GET() { const session = await getSession(); return session ? NextResponse.json(session) : NextResponse.json({ message: "Not signed in." }, { status: 401 }); }
