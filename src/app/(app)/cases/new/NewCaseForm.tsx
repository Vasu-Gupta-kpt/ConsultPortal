"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { createCase } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CaseType, ConversationTurn, Difficulty, Industry } from "@/lib/types";

type StructureEntry = {
  title: string;
  mode: "text" | "image";
  treeText: string;
  imagePath: string;
};

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const CASE_TYPES: CaseType[] = [
  "Guesstimate",
  "Profitability",
  "Market Entry",
  "M&A",
  "Operations",
  "Pricing",
  "Growth Strategy",
  "Cost Reduction",
];

const INDUSTRIES: Industry[] = [
  "Consulting",
  "Healthcare",
  "Technology",
  "Finance",
  "Retail",
  "Manufacturing",
  "FMCG",
  "Education",
  "Energy",
  "Telecom",
];

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const textareaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none";

const FRAMEWORK_TREE_PLACEHOLDER = `*Market Entry
  *Market Attractiveness
    *Market Size
      *Demand
      *Supply
    Growth and trends
  *Feasibility
    *Operational
      *R&D
      *Manufacturing
      *Channels and After Sales
    Financial
  Risk & Benefits
  Entry Strategy`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Add Case"}
    </Button>
  );
}

function ConversationEditor({
  turns,
  setTurns,
}: {
  turns: ConversationTurn[];
  setTurns: (turns: ConversationTurn[]) => void;
}) {
  function addTurn() {
    const lastSpeaker = turns[turns.length - 1]?.speaker;
    const nextSpeaker = lastSpeaker === "interviewer" ? "candidate" : "interviewer";
    setTurns([...turns, { speaker: nextSpeaker, text: "" }]);
  }

  function updateTurn(index: number, patch: Partial<ConversationTurn>) {
    setTurns(turns.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function removeTurn(index: number) {
    setTurns(turns.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {turns.map((turn, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(["interviewer", "candidate"] as const).map((speaker) => (
                <button
                  key={speaker}
                  type="button"
                  onClick={() => updateTurn(i, { speaker })}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    turn.speaker === speaker
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {speaker}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => removeTurn(i)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea
            value={turn.text}
            onChange={(e) => updateTurn(i, { text: e.target.value })}
            rows={2}
            placeholder={turn.speaker === "interviewer" ? "What the interviewer says..." : "What the candidate says..."}
            className={textareaClass}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addTurn}>
        <Plus className="h-3.5 w-3.5" />
        Add Turn
      </Button>
    </div>
  );
}

function StructureEditor({
  structures,
  setStructures,
}: {
  structures: StructureEntry[];
  setStructures: (structures: StructureEntry[]) => void;
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function addStructure() {
    setStructures([...structures, { title: "", mode: "text", treeText: "", imagePath: "" }]);
  }

  function updateStructure(index: number, patch: Partial<StructureEntry>) {
    setStructures(structures.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStructure(index: number) {
    setStructures(structures.filter((_, i) => i !== index));
  }

  async function handleFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadingIndex(index);

    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("case-structures").upload(path, file);

    setUploadingIndex(null);
    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
      return;
    }
    updateStructure(index, { imagePath: path });
  }

  return (
    <div className="space-y-3">
      {structures.map((s, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Input
              value={s.title}
              onChange={(e) => updateStructure(i, { title: e.target.value })}
              placeholder={`Structure ${i + 1} title (optional)`}
              className="h-8"
            />
            <button
              type="button"
              onClick={() => removeStructure(i)}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-1">
            {(["text", "image"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateStructure(i, { mode })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  s.mode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          {s.mode === "text" ? (
            <textarea
              value={s.treeText}
              onChange={(e) => updateStructure(i, { treeText: e.target.value })}
              rows={8}
              placeholder={FRAMEWORK_TREE_PLACEHOLDER}
              className={cn(textareaClass, "font-mono text-xs")}
            />
          ) : (
            <div className="space-y-1.5">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(i, e)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              />
              {uploadingIndex === i && <p className="text-xs text-muted-foreground">Uploading...</p>}
              {s.imagePath && uploadingIndex !== i && (
                <p className="text-xs text-emerald-600">Uploaded</p>
              )}
            </div>
          )}
        </div>
      ))}
      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addStructure}>
        <Plus className="h-3.5 w-3.5" />
        Add Structure
      </Button>
    </div>
  );
}

export default function NewCaseForm() {
  const [state, formAction] = useActionState(createCase, null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [structures, setStructures] = useState<StructureEntry[]>([]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="conversation" value={JSON.stringify(turns)} />
      <input type="hidden" name="structures" value={JSON.stringify(structures)} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Starbucks India Profitability Decline" required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select id="difficulty" name="difficulty" className={selectClass} defaultValue="Medium">
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className={selectClass} defaultValue={CASE_TYPES[0]}>
            {CASE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">Industry</Label>
          <select id="industry" name="industry" className={selectClass} defaultValue={INDUSTRIES[0]}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" placeholder="e.g. BCG" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="estimated_time">Est. Time (minutes)</Label>
          <Input id="estimated_time" name="estimated_time" type="number" min={1} defaultValue={30} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="framework">Framework (comma-separated)</Label>
        <Input id="framework" name="framework" placeholder="e.g. Profitability Tree, MECE" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="casebook">Casebook (optional)</Label>
        <Input id="casebook" name="casebook" placeholder="e.g. BCG Casebook 2023" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Case Statement</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="The case prompt students will read..."
          className={textareaClass}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="case_facts">Case Facts (one per line, optional)</Label>
        <textarea
          id="case_facts"
          name="case_facts"
          rows={3}
          placeholder={"Client is a market leader in the 100cc-125cc commuter segment\nTarget customer: urban commuters"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="additional_info">Additional Information (one per line, optional)</Label>
        <textarea
          id="additional_info"
          name="additional_info"
          rows={3}
          placeholder={"Client is end to end integrated\nAssumption: annual motorcycle sales is ~15 million"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Conversation (optional)</Label>
        <p className="text-xs text-muted-foreground">
          The scripted interviewer/candidate walkthrough shown on the case&apos;s Conversation tab.
        </p>
        <ConversationEditor turns={turns} setTurns={setTurns} />
      </div>

      <div className="space-y-1.5">
        <Label>Structures / Frameworks (optional)</Label>
        <p className="text-xs text-muted-foreground">
          A case can have more than one. For each, either type the tree (one branch per line,
          indent with spaces to nest, prefix a line with <code>*</code> to mark it explored) or
          upload a picture of the diagram instead.
        </p>
        <StructureEditor structures={structures} setStructures={setStructures} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recommendations">Recommendations (one per line, optional)</Label>
        <textarea
          id="recommendations"
          name="recommendations"
          rows={2}
          placeholder="Factor in consumer psychographics alongside demographics to refine demand estimation"
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tips">Tips / Tricks (one per line, optional)</Label>
        <textarea
          id="tips"
          name="tips"
          rows={2}
          placeholder="If given an opportunity to summarize the case in a time strapped interview, try to cover your entire approach"
          className={textareaClass}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" placeholder="e.g. profitability, retail, India" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
