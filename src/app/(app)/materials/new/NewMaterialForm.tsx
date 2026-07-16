"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createMaterial } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { FileType, MaterialCategory } from "@/lib/types";

const CATEGORIES: MaterialCategory[] = ["Framework", "Industry Note", "Skill", "Casebook"];
const FILE_TYPES: FileType[] = ["PDF", "Video", "Article"];

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? "Saving..." : "Add Material"}
    </Button>
  );
}

export default function NewMaterialForm() {
  const [state, formAction] = useActionState(createMaterial, null);
  const [filePath, setFilePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    setFilePath("");

    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("materials").upload(path, file);

    setUploading(false);
    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
      return;
    }
    setFilePath(path);
    setFileName(file.name);
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="file_path" value={filePath} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Profitability Framework - Complete Guide" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What this resource covers..."
          className={textareaClass}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className={selectClass} defaultValue={CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="file_type">File Type</Label>
          <select id="file_type" name="file_type" className={selectClass} defaultValue={FILE_TYPES[0]}>
            {FILE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="file">File (optional)</Label>
        <input
          id="file"
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
        />
        {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
        {fileName && !uploading && !uploadError && (
          <p className="text-xs text-emerald-600">Uploaded: {fileName}</p>
        )}
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        <p className="text-xs text-muted-foreground">
          You can also leave this blank and add the file later via Supabase Studio.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="uploaded_by_label">Uploaded By (optional)</Label>
        <Input id="uploaded_by_label" name="uploaded_by_label" placeholder="e.g. Consulting Club" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" placeholder="e.g. profitability, framework, beginner" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton disabled={uploading} />
    </form>
  );
}
