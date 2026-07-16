import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — IIMC Consult Club",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-foreground">
        <p>
          The IIMC Consult Club Portal (&quot;the Portal&quot;) is a student-run platform for IIM
          Calcutta Consulting Club members. This page explains what data we collect, how it&apos;s
          used, and how you can control it.
        </p>

        <section>
          <h2 className="text-base font-semibold mb-2">1. Who can use the Portal</h2>
          <p>
            Access is restricted to students with an <code>@iimcal.ac.in</code> or{" "}
            <code>@email.iimcal.ac.in</code> Google account, verified at sign-in.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. What we collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>From Google Sign-In:</strong> your name, email address, and profile photo.
            </li>
            <li>
              <strong>Profile details you enter:</strong> year, hostel, room number, contact
              (phone) number, bio, specialization, and tags.
            </li>
            <li>
              <strong>Activity on the Portal:</strong> cases you mark solved, approaches you post,
              upvotes, material downloads, Peer Practice availability slots you list, and booking
              requests you send or receive.
            </li>
            <li>
              <strong>Google Calendar (optional):</strong> if you click &quot;Connect Google
              Calendar&quot;, we request permission to view and manage events on your calendar
              (the <code>calendar.events</code> scope) — nothing broader. We use this only to
              create an event when a Peer Practice request you own is accepted, and to remove it
              if the session is later cancelled. We do not read your existing calendar events, and
              we never request this permission as part of ordinary sign-in — it is a separate,
              opt-in step.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. How we use it</h2>
          <p>
            Your profile and activity data are used to run the Case Library, Learning Materials,
            Peer Practice booking, and Dashboard features described on the Portal. Your contact
            number and hostel/room are shown to classmates so they can coordinate a practice
            session with you. We send email notifications for Peer Practice request/accept/decline/
            cancel events, and offer optional WhatsApp &quot;click-to-chat&quot; links so you can
            message a practice partner directly — we do not read or store WhatsApp message content,
            and we never send automated WhatsApp messages on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. Where it&apos;s stored</h2>
          <p>
            Data is stored in a managed Postgres database (Supabase) with row-level access controls
            so students can only see what the Portal&apos;s features require. Emails are sent via
            Resend. A connected Google Calendar refresh token is stored in a separate, access-
            restricted table that is never exposed through the Portal&apos;s public API — only
            server-side booking-acceptance logic can use it, solely to create/delete the specific
            event tied to your booking.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">5. Sharing</h2>
          <p>
            We do not sell or share your data with third parties for advertising or any purpose
            outside operating the Portal. Data is visible only to other signed-in students of the
            Consulting Club, as needed for the features above (e.g. your name and hostel appear in
            Peer Practice listings).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. Your controls</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Edit or remove your profile details any time from your profile page.</li>
            <li>
              Disconnect Google Calendar access at any time from{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                your Google Account&apos;s third-party access settings
              </a>
              .
            </li>
            <li>
              Request full account deletion by emailing us (see below) — we will remove your
              profile and associated activity data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">7. Contact</h2>
          <p>
            Questions about this policy or your data:{" "}
            <a href="mailto:consultclub@iimcal.ac.in" className="text-primary underline">
              consultclub@iimcal.ac.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
