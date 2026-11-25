import type { ImagePlaceholder } from "@/app/lib/placeholder-images";
import { setAiName, takeDailyAiQuota } from "@/lib/product-info";

// Kept on the free tier: the cheapest model, and a hard daily cap far below Google's free limits.
// "-latest" follows Google's current model, so naming keeps working when old versions are retired.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent";
const DAILY_AI_LIMIT = 30;

const PROMPT = `You name products for ISRA Ethnic, a saree and churidar boutique in Kerala.
Look at the photo and give the outfit a stylish product name of exactly 2 words:
- First word: the main colour as seen in the photo, as an elegant fashion colour name
  (e.g. Maroon, Wine, Peach, Mint, Mustard, Teal, Ivory, Rust, Lavender, Navy, Blush, Emerald).
- Second word: a stylish word for the garment, fabric or style
  (e.g. Saree, Churidar, Kanjeevaram, Kasavu, Anarkali, Organza, Banarasi, Chiffon, Silk, Elegance).
Examples: "Maroon Kanjeevaram", "Mint Anarkali", "Ivory Kasavu", "Blush Organza", "Navy Churidar", "Emerald Silk".
Reply with only the 2 words.`;

const BATCH_SIZE = 2;
const FAILURE_PAUSE_MS = 10 * 60 * 1000;

const inProgress = new Set<string>();
let pausedUntil = 0;

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1).toLowerCase();

// Keeps the first 2 words in Title Case, dropping quotes, markdown or anything extra the model adds.
export function cleanName(text: string) {
  const words = text.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean).slice(0, 2);
  return words.length ? words.map(capitalize).join(" ") : null;
}

async function generateProductName(imageUrl: string, caption: string, apiKey: string) {
  const image = await fetch(imageUrl, { cache: "no-store" });
  if (!image.ok) throw new Error(`Image download failed: ${image.status}`);

  const mimeType = image.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const data = Buffer.from(await image.arrayBuffer()).toString("base64");

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${PROMPT}\n\nInstagram caption (may be empty or unrelated): ${caption}` },
            { inline_data: { mime_type: mimeType, data } },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
    }),
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed: ${response.status}`);

  const text = (body?.candidates?.[0]?.content?.parts || [])
    .map((part: { text?: string }) => part.text || "")
    .join(" ");
  return cleanName(text);
}

// Each post is named once and the name is stored, so Gemini only runs for new posts.
// After a failure (bad key, quota) it pauses, so every page view doesn't retry and burn quota.
export async function fillMissingNames(
  photos: ImagePlaceholder[],
  names: Record<string, string>,
  limit: number
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const generated: Record<string, string> = {};
  if (!apiKey || Date.now() < pausedUntil) return generated;

  const missing = photos
    .filter((photo) => photo.imageUrl && !names[photo.id] && !inProgress.has(photo.id))
    .slice(0, limit);

  for (let index = 0; index < missing.length && Date.now() >= pausedUntil; index += BATCH_SIZE) {
    await Promise.all(
      missing.slice(index, index + BATCH_SIZE).map(async (photo) => {
        inProgress.add(photo.id);
        try {
          if (!(await takeDailyAiQuota(DAILY_AI_LIMIT))) {
            pausedUntil = Date.now() + FAILURE_PAUSE_MS;
            return;
          }
          const name = await generateProductName(photo.imageUrl!, photo.description, apiKey);
          // HSETNX returns 0 when a manual name was saved meanwhile; keep showing that one.
          if (name && (await setAiName(photo.id, name))) generated[photo.id] = name;
        } catch (error) {
          pausedUntil = Date.now() + FAILURE_PAUSE_MS;
          console.error("AI name error:", error instanceof Error ? error.message : error);
        } finally {
          inProgress.delete(photo.id);
        }
      })
    );
  }

  return generated;
}
