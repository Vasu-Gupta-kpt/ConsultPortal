"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/lib/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROGRAMS } from "@/lib/constants";
import type { Hostel, ProfileRow } from "@/lib/types";

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

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export default function ProfileEditor({ profile }: { profile: ProfileRow }) {
  const [state, formAction] = useActionState(updateProfile, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="program">Program</Label>
              <select
                id="program"
                name="program"
                required
                defaultValue={profile.program ?? ""}
                className={selectClass}
              >
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
                defaultValue={profile.batch_number ?? ""}
                placeholder="e.g. 63"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hostel">Hostel</Label>
            <select
              id="hostel"
              name="hostel"
              required
              defaultValue={profile.hostel ?? ""}
              className={selectClass}
            >
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
              defaultValue={profile.contact_number ?? ""}
              placeholder="+91 98765 43210"
              required
            />
            <p className="text-xs text-muted-foreground">
              Shown to classmates so they can reach you for Peer Practice sessions.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room_number">Room Number (optional)</Label>
            <Input
              id="room_number"
              name="room_number"
              defaultValue={profile.room_number ?? ""}
              placeholder="e.g. 214"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialization">Specialization (optional)</Label>
            <Input
              id="specialization"
              name="specialization"
              defaultValue={profile.specialization ?? ""}
              placeholder="e.g. Finance & Strategy"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio (optional)</Label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio ?? ""}
              placeholder="A line about your background and what you're prepping for..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={profile.tags.join(", ")}
              placeholder="e.g. Profitability, M&A, BCG style"
            />
          </div>

          {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
          {state && "success" in state && (
            <p className="text-sm text-emerald-600">Profile updated.</p>
          )}

          <SaveButton />
        </form>
      </CardContent>
    </Card>
  );
}
