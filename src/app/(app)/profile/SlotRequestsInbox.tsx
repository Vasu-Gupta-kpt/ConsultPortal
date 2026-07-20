"use client";

import { useState, useTransition } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { dismissSlotRequest } from "@/lib/actions/peer-practice";

export type IncomingSlotRequest = {
  id: string;
  requesterName: string;
  requesterContact: string | null;
  message: string | null;
  createdAt: string;
};

export default function SlotRequestsInbox({ requests: initialRequests }: { requests: IncomingSlotRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDismiss(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await dismissSlotRequest(id);
      setBusyId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== id));
    });
  }

  if (requests.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Slot Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
          Classmates asking you to add a Peer Practice slot. Add one below whenever suits you.
        </p>
        {requests.map((r) => (
          <div key={r.id} className="rounded-lg border px-3 py-2.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {r.requesterName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{r.requesterName}</p>
                  {r.message && <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.requesterContact && (
                  <a
                    href={`https://wa.me/${r.requesterContact.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                    title="Message on WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  disabled={isPending && busyId === r.id}
                  onClick={() => handleDismiss(r.id)}
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
