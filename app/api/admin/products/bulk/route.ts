import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminApiAuth";
import {
  catalogAdminErrorResponse,
  deleteProducts,
  parseBulkRequest,
  setProductsActive,
} from "@/lib/catalog-admin-service";

/**
 * Bulk activate / deactivate / delete for products.
 *
 * Body: `{ ids: string[], action: "activate" | "deactivate" | "delete" }`.
 * The ids are re-resolved and re-authorised server-side; a client-supplied
 * Mongo query is never executed. Deletion re-checks order references per
 * product and reports a per-record outcome, so a single referenced product is
 * preserved instead of the whole batch failing or silently vanishing.
 */
export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { ids, action } = parseBulkRequest(await request.json());

    const result =
      action === "delete"
        ? await deleteProducts(ids)
        : await setProductsActive(ids, action === "activate");

    return NextResponse.json({ result });
  } catch (error) {
    const response = catalogAdminErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
