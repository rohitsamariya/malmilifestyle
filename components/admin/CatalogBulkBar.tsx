"use client";

import type { CatalogActionResult, CatalogBulkAction, CatalogOutcome } from "./useCatalogBulkAction";

const OUTCOME_STYLES: Record<CatalogOutcome, string> = {
  updated: "border-emerald-200 bg-emerald-50 text-emerald-800",
  deleted: "border-slate-200 bg-slate-50 text-slate-700",
  blocked: "border-amber-200 bg-amber-50 text-amber-800",
  "not-found": "border-red-200 bg-red-50 text-red-700",
};

const ACTION_LABELS: Record<CatalogBulkAction, string> = {
  activate: "Activate",
  deactivate: "Deactivate",
  delete: "Delete",
};

interface CatalogBulkBarProps {
  selectedCount: number;
  totalCount: number;
  busy: CatalogBulkAction | null;
  error: string | null;
  result: CatalogActionResult | null;
  selectionSummary: string;
  noun: string;
  onSelectAll: () => void;
  onClear: () => void;
  onRun: (action: CatalogBulkAction) => void;
  onDismissResult: () => void;
}

/**
 * Selection toolbar plus per-record outcome panel shared by the category and
 * product admin screens.
 *
 * "Delete" is separated from the two state toggles because it is irreversible
 * and may be refused per record; the confirm step spells out the exact number of
 * affected records before anything is sent.
 */
export default function CatalogBulkBar({
  selectedCount,
  totalCount,
  busy,
  error,
  result,
  selectionSummary,
  noun,
  onSelectAll,
  onClear,
  onRun,
  onDismissResult,
}: CatalogBulkBarProps) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  function confirmDelete() {
    const label = selectedCount === 1 ? "1 " + noun : `${selectedCount} ${noun}s`;
    const ok = window.confirm(
      `Permanently delete ${label}?\n\n` +
        "This cannot be undone. Any ${noun} referenced by existing orders will be kept and reported instead of deleted.",
    );
    if (ok) onRun("delete");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-beige bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-forest">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => (allSelected ? onClear() : onSelectAll())}
            className="h-4 w-4"
            disabled={totalCount === 0 || busy !== null}
          />
          {allSelected ? "Clear selection" : "Select all"}
          <span className="font-normal text-earth">
            ({selectedCount} of {totalCount} selected)
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
              selectedCount > 0
                ? "border-forest/20 bg-cream text-forest"
                : "border-beige bg-cream-deep text-earth-light"
            }`}
          >
            {selectedCount > 0 ? `${selectedCount} selected` : "Nothing selected"}
          </span>
          <button
            type="button"
            disabled={selectedCount === 0 || busy !== null}
            onClick={() => onRun("activate")}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
          >
            {busy === "activate" ? "Activating…" : ACTION_LABELS.activate}
          </button>
          <button
            type="button"
            disabled={selectedCount === 0 || busy !== null}
            onClick={() => onRun("deactivate")}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-40"
          >
            {busy === "deactivate" ? "Deactivating…" : ACTION_LABELS.deactivate}
          </button>
          <button
            type="button"
            disabled={selectedCount === 0 || busy !== null}
            onClick={confirmDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 disabled:opacity-40"
          >
            {busy === "delete" ? "Deleting…" : ACTION_LABELS.delete}
          </button>
        </div>
      </div>

      {selectedCount > 0 && selectionSummary ? (
        <p className="px-1 text-[11px] text-earth">Selected: {selectionSummary}</p>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="rounded-2xl border border-beige bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="text-forest">
                {result.requested} requested: {result.updated} updated, {result.deleted} deleted
              </span>
              {result.blocked > 0 ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-amber-800">
                  {result.blocked} kept for order history
                </span>
              ) : null}
              {result.notFound > 0 ? (
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-red-700">
                  {result.notFound} not found
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onDismissResult}
              className="rounded-lg border border-beige bg-cream-deep px-3 py-1.5 text-[11px] font-bold text-earth"
            >
              Dismiss
            </button>
          </div>

          {result.items.some((item) => item.outcome === "blocked" || item.outcome === "not-found") ? (
            <ul className="mt-3 space-y-1.5 border-t border-beige pt-3 text-[11px] text-earth">
              {result.items
                .filter((item) => item.outcome === "blocked" || item.outcome === "not-found")
                .map((item) => (
                  <li key={item.id} className="flex flex-wrap items-start gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-bold ${OUTCOME_STYLES[item.outcome]}`}
                    >
                      {item.outcome === "blocked" ? "Kept" : "Missing"}
                    </span>
                    <span className="font-semibold text-forest">{item.label}</span>
                    {item.reason ? <span className="text-earth-light">{item.reason}</span> : null}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
