import { mockSales } from "@/lib/mockSales";
import { SaleItem } from "@/types";

export async function getLocalSales(zipCode?: string): Promise<SaleItem[]> {
  const endpoint = process.env.GROCERY_SALES_API_URL;
  if (!endpoint) {
    return mockSales;
  }

  try {
    const requestUrl = new URL(endpoint);
    if (zipCode) {
      requestUrl.searchParams.set("zip", zipCode);
    }

    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        ...(process.env.GROCERY_SALES_API_KEY
          ? { Authorization: `Bearer ${process.env.GROCERY_SALES_API_KEY}` }
          : {}),
      },
      next: { revalidate: 60 * 30 },
    });

    if (!response.ok) {
      return mockSales;
    }

    const json = (await response.json()) as { items?: SaleItem[] };
    return json.items?.length ? json.items : mockSales;
  } catch {
    return mockSales;
  }
}
