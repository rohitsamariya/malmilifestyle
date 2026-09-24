import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Small, subtle breadcrumb trail. The current page renders last, unlinked. */
export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-earth-light">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-forest"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cnLast(isLast)}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function cnLast(isLast: boolean): string {
  return isLast ? "font-medium text-forest" : "";
}