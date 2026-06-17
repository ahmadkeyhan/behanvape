import { NextRequest, NextResponse } from "next/server";
import { requireRole, apiError } from "@/lib/api-auth";
import { uploadToS3, getPublicUrl, type UploadFolder } from "@/lib/s3";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// Server-proxied upload: browser -> this route -> S3 (PutObjectCommand). No presign, no bucket CORS.
export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);

    const form = await req.formData();
    const file = form.get("file");
    const folderRaw = (form.get("folder") as string) || "products";
    const folder: UploadFolder = folderRaw === "categories" ? "categories" : "products";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایلی ارسال نشد." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "فقط فایل تصویری مجاز است." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد." }, { status: 400 });
    }

    const ext = file.name.includes(".")
      ? file.name.split(".").pop()!
      : file.type.split("/")[1] || "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = await uploadToS3(buffer, file.type, folder, ext);

    return NextResponse.json({ key, url: getPublicUrl(key) });
  } catch (err) {
    return apiError(err);
  }
}
