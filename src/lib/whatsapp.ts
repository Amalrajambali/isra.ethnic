export const WHATSAPP_NUMBER = "918113081120";

export function formatPrice(price?: string | number | null) {
  if (!price) return "Price on request";
  const value = String(price).trim();
  if (/^rs\.?/i.test(value) || value.startsWith("₹")) return value;
  const amount = Number(value.replace(/,/g, ""));
  return Number.isNaN(amount) ? value : `₹${amount.toLocaleString("en-IN")}`;
}

// The link lets the shop see exactly which post the customer is asking about.
export function openWhatsAppOrder(name: string, price?: string | number | null, link?: string) {
  const message = [
    "👗 Interested in this design!",
    "",
    `*${name}*`,
    price ? `Price: ${formatPrice(price)}` : "Please share the price.",
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
