import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const FILE_PATH = join(process.cwd(), "data", "waitlist.json");
const EXPORT_KEY = process.env.WAITLIST_EXPORT_KEY;

export async function GET(request: NextRequest) {
  if (!EXPORT_KEY) {
    return NextResponse.json({ error: "Export disabled — WAITLIST_EXPORT_KEY not set" }, { status: 503 });
  }

  const key = request.nextUrl.searchParams.get("key");

  if (key !== EXPORT_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let entries: { email: string; timestamp: string; source: string }[] = [];
  try {
    const data = await readFile(FILE_PATH, "utf-8");
    entries = JSON.parse(data);
  } catch {
    entries = [];
  }

  const format = request.nextUrl.searchParams.get("format");

  if (format === "json") {
    return NextResponse.json(entries);
  }

  // Default: CSV
  const csv = [
    "email,timestamp,source",
    ...entries.map((e) => `${e.email},${e.timestamp},${e.source}`),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ritarena-waitlist-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
