import { NextResponse } from "next/server";
import { q } from "@/lib/db";

export const dynamic = "force-dynamic";

// Counts the click, then redirects to the tool's stored link.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await q<{ url: string }>(
    "UPDATE tools SET clicks=clicks+1 WHERE id=$1 AND published RETURNING url", [Number(id) || 0]);
  return rows[0]
    ? NextResponse.redirect(rows[0].url)
    : NextResponse.redirect(new URL("/", _.url));
}
