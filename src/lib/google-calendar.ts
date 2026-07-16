// Server-only helpers for the Google Calendar API. Best-effort by design,
// matching src/lib/email.ts -- a missing/expired token or a failed Google
// API call must never fail the booking action that triggered it.

export async function getFreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("getFreshAccessToken skipped: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set");
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      console.error("getFreshAccessToken failed", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch (err) {
    console.error("getFreshAccessToken threw", err);
    return null;
  }
}

export async function createCalendarEvent({
  accessToken,
  summary,
  description,
  location,
  startISO,
  endISO,
  attendeeEmail,
}: {
  accessToken: string;
  summary: string;
  description: string;
  location: string;
  startISO: string;
  endISO: string;
  attendeeEmail: string;
}): Promise<string | null> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          description,
          location,
          start: { dateTime: startISO, timeZone: "Asia/Kolkata" },
          end: { dateTime: endISO, timeZone: "Asia/Kolkata" },
          attendees: [{ email: attendeeEmail }],
        }),
      }
    );

    if (!res.ok) {
      console.error("createCalendarEvent failed", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as { id?: string };
    return data.id ?? null;
  } catch (err) {
    console.error("createCalendarEvent threw", err);
    return null;
  }
}

export async function deleteCalendarEvent({
  accessToken,
  eventId,
}: {
  accessToken: string;
  eventId: string;
}): Promise<void> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok && res.status !== 410) {
      // 410 Gone means it's already deleted -- not an error for our purposes.
      console.error("deleteCalendarEvent failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("deleteCalendarEvent threw", err);
  }
}
