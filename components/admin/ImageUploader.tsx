"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Folder = "products" | "categories";

/** Single-image field. Stores the S3 key in `value`; previews via the URL returned on upload. */
export function ImageField({
  value,
  initialPreview,
  onChange,
  folder,
  className,
}: {
  value: string;
  initialPreview?: string;
  onChange: (key: string) => void;
  folder: Folder;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialPreview || "");
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const { key, url } = await uploadImage(file, folder);
      onChange(key);
      setPreview(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
        {preview ? (
          <Image src={preview} alt="" fill sizes="80px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-primary hover:underline"
          disabled={busy}
        >
          {value ? "تغییر تصویر" : "انتخاب تصویر"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setPreview("");
            }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            حذف
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

/** Multi-image field for products. `value` is an array of S3 keys. */
export function ImagesField({
  value,
  initialPreviews,
  onChange,
  folder = "products",
}: {
  value: string[];
  initialPreviews?: string[];
  onChange: (keys: string[]) => void;
  folder?: Folder;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialPreviews || []);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((f) => uploadImage(f, folder)),
      );
      onChange([...value, ...uploaded.map((u) => u.key)]);
      setPreviews([...previews, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((key, i) => (
          <div
            key={key + i}
            className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
          >
            {previews[i] && (
              <Image src={previews[i]} alt="" fill sizes="80px" className="object-cover" unoptimized />
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
