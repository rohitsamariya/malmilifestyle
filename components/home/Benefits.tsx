import {
  DropletIcon,
  HeartIcon,
  LeafIcon,
  ShieldIcon,
  WheatIcon,
} from "@/components/ui/icons";

const BENEFITS = [
  { icon: DropletIcon, label: "Wood-Pressed" },
  { icon: WheatIcon, label: "Traditional Processing" },
  { icon: LeafIcon, label: "Carefully Selected" },
  { icon: ShieldIcon, label: "Quality Focused" },
  { icon: HeartIcon, label: "Made With Care" },
];

/**
 * Compact horizontal benefit strip directly under the hero. Only simple,
 * honest process claims — no certifications or health claims.
 */
export default function Benefits() {
  return (
    <section aria-label="Why Malmi" className="border-b border-beige bg-cream">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-7 px-4 py-9 sm:grid-cols-3 sm:px-6 lg:grid-cols-5 lg:px-8">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex flex-col items-center gap-3 text-center"
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-beige bg-white text-forest">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}