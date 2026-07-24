import { cn } from "@/lib/utils/cn";

export function StatusBadge({ value }: { value: string | null }) {
  const label = value?.replaceAll("_", " ") ?? "not available";
  const urgent = value === "refund_pending" || value === "reconciliation_required" || value === "failed";
  const positive = value === "confirmed" || value === "verified" || value === "active" || value === "sent";
  return (
    <span className={cn(
      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
      urgent && "border-red-200 bg-red-50 text-red-800",
      positive && "border-emerald-200 bg-emerald-50 text-emerald-800",
      !urgent && !positive && "border-stone-200 bg-stone-50 text-stone-700",
    )}>
      {label}
    </span>
  );
}
