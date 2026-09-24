"use client";

import { useCart } from "@/lib/cartContext";
import { CheckIcon } from "@/components/ui/icons";

/**
 * Global toast notification for cart actions.
 * Renders at the bottom-right of the viewport.
 * Driven by CartContext.toast state.
 */
export default function CartToast() {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-forest px-5 py-3.5 text-sm font-semibold text-cream shadow-[0_8px_32px_-8px_rgba(21,65,40,0.6)] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <CheckIcon className="h-4 w-4 shrink-0" />
      {toast}
    </div>
  );
}