import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  if (segments.length !== 2 || segments[0] !== "payment-proofs") {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
  const filename = segments[1];
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = types[ext];
  if (!contentType) return NextResponse.json({ error: "文件不存在" }, { status: 404 });

  try {
    const file = await readFile(path.join(process.cwd(), "public", "uploads", "payment-proofs", filename));
    return new NextResponse(file, {
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
