# Proposal for Official Recognition and SSO Integration
## IIMC Consult Club Case Practice Portal
**Submitted to:** Information Systems Group (ISG), IIM Calcutta  
**Submitted by:** IIM Calcutta Consulting Club  
**Date:** June 2026

---

## 1. Executive Summary

The IIM Calcutta Consulting Club is developing a dedicated web portal to support students in consulting interview preparation. The platform provides a structured case library, curated learning materials, and a peer mock-interview booking system — all in one place. We are requesting ISG's endorsement of the portal as an official student platform and integration with the Institute's Single Sign-On (SSO) / LDAP system so students can log in using their existing IIMC credentials.

---

## 2. Problem Statement

Consulting placements are among the most sought-after outcomes at IIM Calcutta, yet preparation resources today are fragmented across WhatsApp groups, Google Drive folders, and informal peer networks. Students face three recurring pain points:

1. **Discoverability** — Cases, casebooks, and frameworks are scattered and difficult to find or organise by difficulty or type.
2. **Progress tracking** — There is no structured way for a student to know which cases they have covered, where they stand relative to peers, or which areas need more practice.
3. **Peer practice co-ordination** — Finding a practice partner, aligning on availability, and knowing a partner's expertise requires manual back-and-forth over messaging apps.

These gaps are especially acute for first-year students who join campus with little prior consulting exposure and limited time before interviews begin.

---

## 3. Proposed Solution

The **IIMC Consult Club Portal** is a Next.js web application with three core modules:

### 3.1 Case Library
- 120+ cases tagged by difficulty (Easy / Medium / Hard), type (Profitability, Market Entry, Guesstimate, M&A, Operations, Pricing, Growth Strategy, Cost Reduction), industry, company, and casebook source.
- Each case has a structured description, framework hints, and a community "Approaches" section where students post and upvote their solutions — similar to LeetCode's discussion tab.
- Students mark cases as solved; solved status is persisted to their profile.

### 3.2 Learning Materials
- Curated repository of PDFs and videos: industry primers, framework guides, the official IIMC Casebook, and skill-building resources uploaded by the club and alumni.
- Categorised, searchable, and downloadable in one place.

### 3.3 Peer Practice Booking
- Students list their available time slots and preferred meeting locations (NH, OH, Annexe, Library, LVH, Tagore).
- Filters by year (Year 1 / Year 2), case expertise, location, and time of day (Morning / Afternoon / Evening / Night).
- One-click slot booking with confirmation.

### 3.4 Personal Dashboard
- LeetCode-style progress view: cases solved by difficulty, current streak, batch rank, and weekly activity grid.

---

## 4. Technical Architecture

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript | Industry-standard React framework; fast, SEO-friendly |
| Styling | Tailwind CSS v4 + shadcn/ui | Consistent, accessible component library |
| Database | Supabase (PostgreSQL) | Managed, open-source, generous free tier |
| Authentication | IIMC SSO / LDAP *(requested)* | Seamless login; no separate credential management |
| File Storage | Supabase Storage / Cloudflare R2 | PDFs and materials; low egress cost |
| Hosting | Vercel (cloud) or IIMC servers *(optional)* | Zero-downtime deploys; scalable |

The application is entirely stateless on the frontend; all user data lives in the database. It can be hosted on Vercel's cloud infrastructure (outside IIMC network) or on the Institute's own servers if ISG prefers.

---

## 5. Data and Privacy

- The portal will collect only: student name, email (from SSO), year, and voluntary profile information (hostel, specialisation, bio).
- No sensitive academic or financial data is stored.
- All case-solving activity and peer bookings are stored only within the platform and not shared externally.
- The codebase will be made available to ISG for review at any time.

---

## 6. Projected Usage

| Metric | Estimate |
|---|---|
| Monthly active users | 800–1,000 (full batch) |
| Case solves per user/month | ~20 |
| Total case solve events/month | ~20,000 |
| Peak concurrent users | 15–30 |
| Materials downloads/month | ~5,000 |

These numbers are well within the free or low-cost tiers of all infrastructure components.

---

## 7. Cost Summary

The club will bear all infrastructure costs independently. No budget is requested from ISG or the Institute.

| Component | Provider | Monthly Cost |
|---|---|---|
| App hosting | Vercel Pro | $20 |
| Database + Auth | Supabase (free tier) | $0 |
| File storage | Cloudflare R2 | ~$1–2 |
| Email (booking confirmations) | Resend (free tier) | $0 |
| Domain | External registrar | ~$1 |
| **Total** | | **~$22–23/month** |

---

## 8. Requests to ISG

We are not requesting any financial support or hosting infrastructure. Our two specific requests are:

### Request 1 — SSO / LDAP Integration
We request ISG's support to integrate the portal with the Institute's existing student authentication system (LDAP / CAS / SAML), so that students can log in using their `@iimcal.ac.in` credentials. This would:
- Eliminate the need for a separate sign-up flow.
- Ensure only current IIMC students can access the platform.
- Automatically provision user profiles (name, year, roll number) from the directory.

We are happy to follow any technical specifications or security requirements ISG sets for third-party SSO integration.

### Request 2 — Official Endorsement
We request that ISG acknowledge the portal as an officially recognised student platform of IIM Calcutta. This endorsement would:
- Allow us to use the Institute's branding guidelines on the portal.
- Lend credibility to the platform among students and alumni contributors.
- Enable us to communicate about the portal through official Institute channels.

---

## 9. Implementation Timeline

| Milestone | Target |
|---|---|
| Frontend prototype complete | July 2026 |
| Backend + database integration | August 2026 |
| SSO integration (pending ISG approval) | September 2026 |
| Pilot launch (Year 1 batch) | October 2026 |
| Full launch (both batches) | November 2026 |

---

## 10. Contact

For technical queries, a demo of the working prototype, or access to the codebase, please reach out to:

**IIM Calcutta Consulting Club**  
[Club email / student representative contact]

We are available for a meeting with the ISG team at your convenience to walk through the platform and answer any questions.

---

*This proposal has been prepared by the IIM Calcutta Consulting Club. The portal is a student-led initiative and is not affiliated with any commercial entity.*
