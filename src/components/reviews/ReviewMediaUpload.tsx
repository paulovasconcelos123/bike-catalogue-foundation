import { useRef, useState } from "react";
import { Loader2, Upload, X, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const BUCKET = "review-media";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

export type ReviewMediaItem = { url: string; type: "image" | "video" };

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadReviewFile(file: File, userId: string, subfolder: string) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${subfolder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return publicUrl(path);
}

export function ReviewMediaUpload({
  userId,
  value,
  onChange,
  subfolder = "pending",
}: {
  userId: string;
  value: ReviewMediaItem[];
  onChange: (v: ReviewMediaItem[]) => void;
  subfolder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (value.length + files.length > 10) {
      toast.error("Máximo de 10 arquivos por avaliação");
      return;
    }
    setUploading(true);
    try {
      const added: ReviewMediaItem[] = [];
      for (const file of Array.from(files)) {
        const isImage = IMAGE_TYPES.includes(file.type);
        const isVideo = VIDEO_TYPES.includes(file.type);
        if (!isImage && !isVideo) {
          toast.error(`${file.name}: formato inválido`);
          continue;
        }
        if (isImage && file.size > IMAGE_MAX) {
          toast.error(`${file.name}: imagem excede 5MB`);
          continue;
        }
        if (isVideo && file.size > VIDEO_MAX) {
          toast.error(`${file.name}: vídeo excede 50MB`);
          continue;
        }
        try {
          const url = await uploadReviewFile(file, userId, subfolder);
          added.push({ url, type: isImage ? "image" : "video" });
        } catch (e: any) {
          toast.error(`${file.name}: ${e.message}`);
        }
      }
      if (added.length) onChange([...value, ...added]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 p-4 text-center">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar fotos ou vídeo
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG/PNG/WEBP até 5MB · MP4/WEBM até 50MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((m, i) => (
            <div
              key={m.url}
              className="group relative overflow-hidden rounded-md border border-border bg-muted"
            >
              {m.type === "image" ? (
                <img src={m.url} alt="" className="aspect-square w-full object-cover" />
              ) : (
                <div className="relative aspect-square w-full bg-black">
                  <video src={m.url} className="h-full w-full object-cover" muted preload="metadata" />
                  <Play className="absolute inset-0 m-auto h-6 w-6 text-white/80" />
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded bg-background/85 p-1 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remover"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
