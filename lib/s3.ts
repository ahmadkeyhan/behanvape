import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

/*
 * The ONLY place that knows about the S3 key prefix and the public URL base.
 * Every object key the app writes includes the prefix exactly once, and the
 * same full key is appended to S3_PUBLIC_URL_BASE to build the display URL.
 * Keeping both in one module guarantees they can never drift or double-apply.
 */
const KEY_PREFIX = (process.env.S3_KEY_PREFIX || "behanvape").replace(/^\/+|\/+$/g, "");

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 is not configured (S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY).");
  }
  _client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || "default",
    // Generic S3-compatible bucket (ParsPack) -> path-style addressing.
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export type UploadFolder = "products" | "categories";

/**
 * Uploads a file buffer to `${prefix}/{folder}/{uuid}.{ext}` and returns the
 * full object key (prefix included). Reads are public, so no ACL is set —
 * the bucket itself is public-read for GET.
 */
export async function uploadToS3(
  body: Buffer | Uint8Array,
  contentType: string,
  folder: UploadFolder,
  ext: string,
): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not set.");
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const key = `${KEY_PREFIX}/${folder}/${randomUUID()}.${safeExt}`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

/** Builds the public display URL for a stored key (which already includes the prefix). */
export function getPublicUrl(key?: string | null): string {
  if (!key) return "";
  const rawBase = process.env.S3_PUBLIC_URL_BASE || "";
  const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
  return base + key.replace(/^\/+/, "");
}
