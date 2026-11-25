export const WHATSAPP_NUMBER = "918113081120";

// "1499", 2499, "Rs. 1,499" or "₹1499" -> "1,499" (Indian digit grouping), or null when there is no price.
export function formatAmount(price?: string | number | null) {
  const amount = Number(
    String(price ?? "")
      .replace(/^\s*(rs\.?|inr|₹)\s*/i, "")
      .replace(/[^\d.]/g, "")
  );
  return amount > 0 ? amount.toLocaleString("en-IN") : null;
}

// Plain-text price for WhatsApp messages, where an icon can't be used.
export function formatPrice(price?: string | number | null) {
  const amount = formatAmount(price);
  return amount ? `Rs. ${amount}` : "Price on request";
}

// The link lets the shop see exactly which post the customer is asking about.
export function openWhatsAppOrder(name: string, price?: string | number | null, link?: string) {
  const hasPrice = Boolean(formatAmount(price));
  const message = [
    "👗 Interested in this design!",
    "",
    `*${name}*`,
    hasPrice ? `Price: ${formatPrice(price)}` : "Please share the price.",
    link ? `Link: ${link}` : "",
    "",
    "Can you confirm available sizes?",
    "",
    "🛍️ ISRA Ethnic - Tirur, Kerala",
  ]
    .filter((line, index, lines) => line || lines[index - 1])
    .join("\n");

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}
