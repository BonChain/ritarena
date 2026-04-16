import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Use /data if it exists (Railway volume mount), otherwise ./data
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const FILE_PATH = join(DATA_DIR, "waitlist.json");

interface WaitlistEntry {
  email: string;
  timestamp: string;
  source: string;
}

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function getEntries(): Promise<WaitlistEntry[]> {
  try {
    const data = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveEntries(entries: WaitlistEntry[]) {
  await ensureDir();
  await writeFile(FILE_PATH, JSON.stringify(entries, null, 2));
}

// POST — add email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const entries = await getEntries();

    if (entries.some((e) => e.email === email)) {
      return NextResponse.json({ message: "Already registered", count: entries.length });
    }

    entries.push({
      email,
      timestamp: new Date().toISOString(),
      source: body.source || "waitlist",
    });

    await saveEntries(entries);

    return NextResponse.json({ message: "Added", count: entries.length });
  } catch (err) {
    console.error("Waitlist POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET — return count
export async function GET() {
  try {
    const entries = await getEntries();
    return NextResponse.json({ count: entries.length });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
