import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminApiAuth";
import {
  catalogAdminErrorResponse,
  deleteCategories,
  parseBulkRequest,
  setCategoriesActive,
} from "@/lib/catalog-admin-service";

/**
 * Bulk activate / deactivate / delete for categories.
 *
 * Body: `{ ids: string[], action: "activate" | "deactivate" | "delete" }`.
 * Bulk delete applies exactly the same safety rules as deleting one category:
 * each category is checked for products referenced by historical orders and
 * skipped with a reason when it cannot be removed safely. Partial success is
 * reported per record rather than failing the whole batch.
 */
export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { ids, action } = parseBulkRequest(await request.json());

    const result =
      action === "delete"
        ? await deleteCategories(ids)
        : await setCategoriesActive(ids, action === "activate");

    return NextResponse.json({ result });
  } catch (error) {
    const response = catalogAdminErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
