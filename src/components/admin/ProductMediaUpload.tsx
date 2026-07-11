import { useRef, useState } from "react";
import { Loader2, Upload, X, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const BUCKET = "product-media";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function pathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return publicUrl(path);
}

async function removeFromStorage(url: string) {
  const path = pathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export function ImagesUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!IMAGE_TYPES.includes(file.type)) {
          toast.error(`${file.name}: formato inválido (use jpg, png ou webp)`);
          continue;
        }
        if (file.size > IMAGE_MAX) {
          toast.error(`${file.name}: excede 5MB`);
          continue;
        }
        try {
          uploaded.push(await uploadFile(file, "images"));
        } catch (e: any) {
          toast.error(`${file.name}: ${e.message}`);
        }
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(i: number) {
    const url = value[i];
    const next = value.filter((_, idx) => idx !== i);
    onChange(next);
    removeFromStorage(url).catch(() => undefined);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 p-6 text-center"
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="font-montserrat text-sm text-muted-foreground">
          Arraste imagens aqui ou
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Selecionar arquivos
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WEBP · até 5MB cada
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, i) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                src={url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                  <Star className="h-3 w-3" /> Capa
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/85 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  onClick={() => remove(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VideoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      toast.error("Formato inválido (use mp4 ou webm)");
      return;
    }
    if (file.size > VIDEO_MAX) {
      toast.error("Vídeo excede 50MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file, "videos");
      if (value) removeFromStorage(value).catch(() => undefined);
      onChange(url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    if (value) removeFromStorage(value).catch(() => undefined);
    onChange(null);
  }

  return (
    <div>
      {value ? (
        <div className="space-y-2">
          <video
            src={value}
            controls
            className="w-full max-h-64 rounded-md border border-border bg-black"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Substituir vídeo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={remove}
              disabled={uploading}
            >
              <X className="mr-1 h-4 w-4" /> Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 p-6 text-center">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Selecionar vídeo
          </Button>
          <p className="text-xs text-muted-foreground">
            MP4 ou WEBM · até 50MB · opcional
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
