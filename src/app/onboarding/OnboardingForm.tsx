"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitOnboarding } from "@/lib/actions/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PROGRAMS } from "@/lib/constants";
import type { Hostel } from "@/lib/types";

const HOSTELS: Hostel[] = [
  "New Hostel",
  "Tagore",
  "Ramanujan Hostel(OH)",
  "Lake View Hostel",
  "Annexe",
  "Tata Hall",
  "Others",
];

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Continue"}
    </Button>
  );
}

export default function OnboardingForm({
  defaultFullName,
}: {
  defaultFullName: string;
}) {
  const [state, formAction] = useActionState(submitOnboarding, null);

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm font-medium">
        Welcome{defaultFullName ? `, ${defaultFullName}` : ""}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="program">Program</Label>
          <select id="program" name="program" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              Select
            </option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="batch_number">Batch Number</Label>
          <Input
            id="batch_number"
            name="batch_number"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 63"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hostel">Hostel</Label>
        <select id="hostel" name="hostel" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            Select your hostel
          </option>
          {HOSTELS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact_number">Contact Number</Label>
        <Input
          id="contact_number"
          name="contact_number"
          type="tel"
          placeholder="+91 98765 43210"
          required
        />
        <p className="text-xs text-muted-foreground">
          Shown to classmates so they can reach you for Peer Practice sessions.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="room_number">Room Number (optional)</Label>
        <Input id="room_number" name="room_number" placeholder="e.g. 214" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialization">Specialization (optional)</Label>
        <Input
          id="specialization"
          name="specialization"
          placeholder="e.g. Finance & Strategy"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio (optional)</Label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          placeholder="A line about your background and what you're prepping for..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
