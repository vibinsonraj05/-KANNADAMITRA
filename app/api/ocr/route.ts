import { NextResponse } from "next/server";
const attempts = new Map<string, number[]>();
function limited(ip: string) { const now = Date.now(); const current = (attempts.get(ip) || []).filter(time => now - time < 60_000); current.push(now); attempts.set(ip, current); return current.length > 6; }

export async function POST(request: Request) {
  let body: { image?: unknown; mimeType?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid image request." }, { status: 400 }); }
  if (typeof body.image !== "string" || !["image/jpeg", "image/png", "image/webp"].includes(String(body.mimeType))) return NextResponse.json({ message: "Choose a JPG, PNG or WebP image." }, { status: 400 });
  const base64 = body.image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  if (!base64 || base64.length > 5_600_000) return NextResponse.json({ message: "Image must be smaller than 4 MB." }, { status: 413 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ message: "Too many image scans. Please wait a minute and try again." }, { status: 429 });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ message: "Image text recognition isn’t configured. Add GEMINI_API_KEY to .env.local and restart the server." }, { status: 503 });
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", signal: AbortSignal.timeout(60_000), headers: { "x-goog-api-key": key, "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: "Extract all readable text from the image, preserving its language, line breaks, and reading order. Do not translate, summarize, infer missing words, or add text. Return only the extracted text. If no text is readable, return exactly NO_TEXT_FOUND." }] }, contents: [{ role: "user", parts: [{ inlineData: { mimeType: body.mimeType, data: base64 } }, { text: "Read all visible text in this image." }] }], generationConfig: { maxOutputTokens: 4000, temperature: 0 } }) });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return NextResponse.json({ message: "Gemini rejected its API key or access is not enabled. Check GEMINI_API_KEY and API permissions." }, { status: 502 });
      if (response.status === 404) return NextResponse.json({ message: `The configured Gemini model (${model}) was not found. Check GEMINI_MODEL.` }, { status: 502 });
      if (response.status === 429) return NextResponse.json({ message: "Gemini is busy or the account limit was reached. Try again shortly." }, { status: 503 });
      return NextResponse.json({ message: `Image text recognition failed (${response.status}). Please retry.` }, { status: 502 });
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim() || "";
    if (!text || text === "NO_TEXT_FOUND") return NextResponse.json({ message: "No text could be read. Try a closer, clearer photo." }, { status: 422 });
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error && error.name === "TimeoutError" ? "Image scanning timed out. Please retry." : "Could not reach Gemini. Please retry." }, { status: 502 });
  }
}
