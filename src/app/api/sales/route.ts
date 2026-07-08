import { NextResponse } from "next/server";
import { getLocalSales } from "@/lib/sales";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get("zip") ?? undefined;
  const items = await getLocalSales(zipCode);
  return NextResponse.json({ items });
}
