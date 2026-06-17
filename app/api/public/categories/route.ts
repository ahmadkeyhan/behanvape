import { NextResponse } from "next/server";
import { getCategories } from "@/lib/public-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: minimal category list for the global header's products menu (no auth).
export async function GET() {
  try {
    const categories = await getCategories();
    const trimmed = categories.map((c) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      productType: c.productType,
    }));
    return NextResponse.json(trimmed);
  } catch (err) {
    console.error("public categories error:", err);
    // Don't break the global header if the DB hiccups — return an empty menu.
    return NextResponse.json([]);
  }
}
