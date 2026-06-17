/* Thin client-side fetch wrapper: JSON in/out, throws Persian error messages from the API. */
export async function apiFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error || "خطایی رخ داد. دوباره تلاش کنید.");
  }
  return data as T;
}

export interface UploadResult {
  key: string;
  url: string;
}

/** Uploads one image to the server-proxied S3 route; returns the stored key + public URL. */
export async function uploadImage(
  file: File,
  folder: "products" | "categories",
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return apiFetch<UploadResult>("/api/upload", { method: "POST", body: form });
}
