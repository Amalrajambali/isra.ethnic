import { IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/whatsapp";

// The ₹ text glyph renders inconsistently across fonts, so draw it as an icon instead.
export function Price({ value, className }: { value?: string | number | null; className?: string }) {
  const amount = formatAmount(value);

  if (!amount) return <p className={className}>Price on request</p>;

  return (
    <p className={cn("inline-flex items-center", className)}>
      <IndianRupee aria-label="Rupees" className="h-[0.95em] w-[0.95em] shrink-0" strokeWidth={2.5} />
      {amount}
    </p>
  );
}
