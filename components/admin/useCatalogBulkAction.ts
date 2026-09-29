"use client";

import { useCallback, useState } from "react";

export type CatalogBulkAction = "activate" | "deactivate" | "delete";

export type CatalogOutcome = "updated" | "deleted" | "blocked" | "not-found";

export interface CatalogActionItem {
  id: string;
  label: string;
  outcome: CatalogOutcome;
  reason?: string;
}

export interface CatalogActionResult {
  requested: number;
  updated: number;
  deleted: number;
  blocked: number;
  notFound: number;
  items: CatalogActionItem[];
}

export interface CatalogBulkController {
  selected: string[];
  busy: CatalogBulkAction | null;
  result: CatalogActionResult | null;
  error: string | null;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  run: (action: CatalogBulkAction) => Promise<void>;
  dismissResult: () => void;
  describeSelection: string;
}

/**
 * Selection + execution state for a server-side bulk catalog action.
 *
 * The hook only ever sends `{ ids, action }`. Every record is re-validated,
 * re-authorised and individually safety-checked on the server, so a partial
 * result (some deleted, some blocked) is reported rather than rolled back.
 */
export function useCatalogBulkAction(
  endpoint: string,
  onDone: () => Promise<void> | void,
  recordLabel: (id: string) => string,
): CatalogBulkController {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<CatalogBulkAction | null>(null);
  const [result, setResult] = useState<CatalogActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSelected = useCallback((id: string) => selected.includes(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }, []);

  const selectMany = useCallback((ids: string[]) => setSelected(ids), []);

  const clearSelection = useCallback(() => {
    setSelected([]);
    setResult(null);
    setError(null);
  }, []);

  const dismissResult = useCallback(() => setResult(null), []);

  async function run(action: CatalogBulkAction) {
    if (selected.length === 0) return;
    setBusy(action);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Bulk action failed.");
      setResult(data.result as CatalogActionResult);
      setSelected([]);
      await onDone();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Bulk action failed.");
    } finally {
      setBusy(null);
    }
  }

  const describeSelection = selected.map((id) => recordLabel(id) || id).join(", ");

  return {
    selected,
    busy,
    result,
    error,
    isSelected,
    toggle,
    selectMany,
    clearSelection,
    run,
    dismissResult,
    describeSelection,
  };
}
