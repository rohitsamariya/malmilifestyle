/**
 * Renders the *actual* mobile verification state. There is no self-serve OTP
 * flow yet, so an unverified number is shown as such rather than faked — no
 * button is rendered that cannot really verify anything.
 */
export default function PhoneStatusBadge({
  verified,
  tone = "default",
  className = "",
}: {
  verified: boolean;
  tone?: "default" | "onDark";
  className?: string;
}) {
  const styles =
    tone === "onDark"
      ? verified
        ? "bg-cream/15 text-cream ring-1 ring-cream/25"
        : "bg-gold/20 text-gold-soft ring-1 ring-gold/30"
      : verified
        ? "bg-forest/10 text-forest"
        : "bg-gold/20 text-earth";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles} ${className}`}
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  );
}
