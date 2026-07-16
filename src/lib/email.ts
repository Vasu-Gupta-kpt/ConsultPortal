// Thin wrapper around Resend's REST API (no SDK dependency needed for one
// endpoint). Server-only -- reads RESEND_API_KEY, never expose it to the
// client.
//
// Best-effort by design: a notification failure must never fail the
// underlying booking/profile action that triggered it, since the database
// write is the actual source of truth. Callers should not await this for
// correctness, just fire it and let it log on failure.
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("sendEmail skipped: RESEND_API_KEY or RESEND_FROM_EMAIL not set");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      console.error("sendEmail failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("sendEmail threw", err);
  }
}
