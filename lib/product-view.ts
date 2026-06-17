import { getPublicUrl } from "@/lib/s3";

/** Attaches public image URLs to a serialized product (so clients never build URLs). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProductView<T extends Record<string, any>>(
  p: T,
): T & { imageUrls: string[] } {
  return { ...p, imageUrls: (p.images || []).map((k: string) => getPublicUrl(k)) };
}
