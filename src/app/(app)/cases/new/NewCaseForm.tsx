"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCase } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CaseType, Difficulty, Industry } from "@/lib/types";

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Add Case"}
    </Button>
  );
}

export default function NewCaseForm() {
  const [state, formAction] = useActionState(createCase, null);

  return (
    <form action={formAction} className="space-y-5">
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
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="The case prompt students will read..."
          className={textareaClass}
          required
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
