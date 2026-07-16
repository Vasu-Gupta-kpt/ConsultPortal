/**
 * One-off seed script for Peer Practice demo data (6 students + their
 * availability slots + a couple of bookings), translated from the old
 * src/lib/mock-data.ts mockStudents array.
 *
 * Why this isn't a SQL migration: availability_slots.profile_id is NOT NULL
 * and references profiles(id) -> auth.users(id). Plain SQL migrations run
 * under the migration role and cannot create auth.users rows (that needs
 * the Auth Admin API), so this uses the service role key directly via
 * supabase-js instead.
 *
 * Run once, after `supabase db push`:
 *   npx tsx scripts/seed-dev-data.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (server-only -- get it
 * from Supabase Dashboard > Settings > API > service_role secret. NEVER
 * prefix it with NEXT_PUBLIC_ and never import it from any client/browser
 * code path -- it bypasses RLS entirely).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type MockSlot = {
  daysFromToday: number;
  startTime: string;
  endTime: string;
  location: string;
  isBooked: boolean;
};

type MockStudent = {
  name: string;
  year: 1 | 2;
  hostel: string;
  specialization?: string;
  bio: string;
  contactNumber: string;
  roomNumber?: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  availability: MockSlot[];
};

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromToday(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return toDateInputValue(date);
}

const mockStudents: MockStudent[] = [
  {
    name: "Rahul Verma",
    year: 2,
    hostel: "New Hostel",
    specialization: "Finance & Strategy",
    bio: "Prepped for MBB. Cleared BCG final round. Happy to help with profitability and M&A cases.",
    contactNumber: "+91 90000 00001",
    roomNumber: "214",
    rating: 4.8,
    reviewCount: 24,
    tags: ["Profitability", "M&A", "BCG style"],
    availability: [
      { daysFromToday: 3, startTime: "18:00", endTime: "19:00", location: "NH", isBooked: false },
      { daysFromToday: 5, startTime: "20:00", endTime: "21:00", location: "Tagore", isBooked: true },
      { daysFromToday: 8, startTime: "10:00", endTime: "11:00", location: "OH", isBooked: false },
    ],
  },
  {
    name: "Ananya Singh",
    year: 2,
    hostel: "Lake View Hostel",
    specialization: "Marketing & Strategy",
    bio: "Placed at McKinsey. Specialise in market entry and growth strategy cases. McKinsey style interviewer.",
    contactNumber: "+91 90000 00002",
    roomNumber: "108",
    rating: 4.9,
    reviewCount: 31,
    tags: ["Market Entry", "Growth Strategy", "McKinsey style"],
    availability: [
      { daysFromToday: 4, startTime: "19:00", endTime: "20:00", location: "Annexe", isBooked: false },
      { daysFromToday: 6, startTime: "20:00", endTime: "21:00", location: "Library", isBooked: false },
      { daysFromToday: 9, startTime: "11:00", endTime: "12:00", location: "NH", isBooked: true },
    ],
  },
  {
    name: "Karthik Nair",
    year: 1,
    hostel: "Ramanujan Hostel(OH)",
    bio: "First year, practicing for placements. Looking for mock interview partners for guesstimate and ops cases.",
    contactNumber: "+91 90000 00003",
    rating: 4.5,
    reviewCount: 8,
    tags: ["Guesstimate", "Operations"],
    availability: [
      { daysFromToday: 3, startTime: "21:00", endTime: "22:00", location: "OH", isBooked: false },
      { daysFromToday: 7, startTime: "19:00", endTime: "20:00", location: "LVH", isBooked: false },
    ],
  },
  {
    name: "Sneha Patel",
    year: 1,
    hostel: "Tagore",
    bio: "Background in engineering. Strong at operations and cost reduction cases. Let's practice together!",
    contactNumber: "+91 90000 00004",
    roomNumber: "312",
    rating: 4.6,
    reviewCount: 12,
    tags: ["Operations", "Cost Reduction", "Manufacturing"],
    availability: [
      { daysFromToday: 5, startTime: "18:00", endTime: "19:00", location: "Annexe", isBooked: false },
      { daysFromToday: 8, startTime: "16:00", endTime: "17:00", location: "Tagore", isBooked: false },
      { daysFromToday: 9, startTime: "17:00", endTime: "18:00", location: "Library", isBooked: true },
    ],
  },
  {
    name: "Vikram Gupta",
    year: 2,
    hostel: "Tata Hall",
    specialization: "Operations & Supply Chain",
    bio: "Placed at Deloitte S&O. Expert at operations, supply chain, and pricing cases.",
    contactNumber: "+91 90000 00005",
    roomNumber: "45",
    rating: 4.7,
    reviewCount: 19,
    tags: ["Operations", "Pricing", "Deloitte style"],
    availability: [
      { daysFromToday: 4, startTime: "20:00", endTime: "21:00", location: "NH", isBooked: false },
      { daysFromToday: 7, startTime: "18:00", endTime: "19:00", location: "LVH", isBooked: true },
    ],
  },
  {
    name: "Meera Iyer",
    year: 2,
    hostel: "Annexe",
    specialization: "Healthcare & Life Sciences",
    bio: "Healthcare background + MBA. Great for healthcare, pharma, and FMCG cases. Bain interviewer style.",
    contactNumber: "+91 90000 00006",
    rating: 4.8,
    reviewCount: 17,
    tags: ["Healthcare", "Pharma", "Bain style"],
    availability: [
      { daysFromToday: 3, startTime: "19:00", endTime: "20:00", location: "Tagore", isBooked: false },
      { daysFromToday: 6, startTime: "19:00", endTime: "20:00", location: "OH", isBooked: false },
    ],
  },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
}

async function main() {
  // Phase 1: create every auth user + profile first. Bookings need a
  // *different*, already-created student as the booker, which isn't
  // available yet if users and slots are created in a single interleaved
  // pass (the first student's booked slots would have no one else to
  // assign as the booker).
  const studentIds: (string | null)[] = [];

  for (const student of mockStudents) {
    const email = `seed.${slugify(student.name)}@iimcal.ac.in`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: student.name },
    });

    if (createError || !created.user) {
      console.error(`Failed to create auth user for ${student.name}:`, createError?.message);
      studentIds.push(null);
      continue;
    }

    const userId = created.user.id;
    studentIds.push(userId);

    // The on_auth_user_created trigger already inserted a bare profiles row
    // (full_name/avatar_url only) -- fill in the rest.
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        year: student.year,
        hostel: student.hostel,
        contact_number: student.contactNumber,
        room_number: student.roomNumber ?? null,
        specialization: student.specialization ?? null,
        bio: student.bio,
        tags: student.tags,
        rating: student.rating,
        review_count: student.reviewCount,
      })
      .eq("id", userId);

    if (profileError) {
      console.error(`Failed to update profile for ${student.name}:`, profileError.message);
    }

    console.log(`Created ${student.name} (${email})`);
  }

  // Phase 2: create slots + bookings now that every student id is known.
  for (let i = 0; i < mockStudents.length; i++) {
    const student = mockStudents[i];
    const userId = studentIds[i];
    if (!userId) continue;

    for (const slot of student.availability) {
      const { data: slotRow, error: slotError } = await admin
        .from("availability_slots")
        .insert({
          profile_id: userId,
          slot_date: dateFromToday(slot.daysFromToday),
          start_time: slot.startTime,
          end_time: slot.endTime,
          location: slot.location,
        })
        .select()
        .single();

      if (slotError || !slotRow) {
        console.error(`Failed to create slot for ${student.name}:`, slotError?.message);
        continue;
      }

      if (slot.isBooked) {
        // Booker is the next seed student in the roster (round robin, always
        // a different student) -- who booked whom doesn't matter for demo
        // purposes, only that the slot shows up as booked. Inserted directly
        // as 'confirmed' (bypassing the request_booking/accept_booking RPCs,
        // fine for admin-only seeding) so demo data reads as already-settled
        // sessions rather than dangling pending requests.
        const bookerId = studentIds[(i + 1) % mockStudents.length];
        if (bookerId) {
          const { error: bookingError } = await admin.from("bookings").insert({
            slot_id: slotRow.id,
            booked_by: bookerId,
            status: "confirmed",
          });
          if (bookingError) {
            console.error(`Failed to book slot for ${student.name}:`, bookingError.message);
          }
        }
      }
    }

    console.log(`Seeded availability for ${student.name}`);
  }

  const seededCount = studentIds.filter(Boolean).length;
  console.log(`\nDone. Seeded ${seededCount}/${mockStudents.length} students.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
