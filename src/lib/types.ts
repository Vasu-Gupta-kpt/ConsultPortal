// Display-lookup unions -- these mirror the Postgres enums 1:1 (see
// supabase/migrations/*_enums.sql) and back the color/label lookup records
// used throughout the UI (e.g. `difficultyColors: Record<Difficulty, string>`).
export type Difficulty = "Easy" | "Medium" | "Hard";

export type CaseType =
  | "Guesstimate"
  | "Profitability"
  | "Market Entry"
  | "M&A"
  | "Operations"
  | "Pricing"
  | "Growth Strategy"
  | "Cost Reduction";

export type Industry =
  | "Consulting"
  | "Healthcare"
  | "Technology"
  | "Finance"
  | "Retail"
  | "Manufacturing"
  | "FMCG"
  | "Education"
  | "Energy"
  | "Telecom";

export type MaterialCategory = "Framework" | "Industry Note" | "Skill" | "Casebook";

export type FileType = "PDF" | "Video" | "Article";

export type SlotLocation = "NH" | "OH" | "Annexe" | "Library" | "LVH" | "Tagore";

export type Hostel =
  | "New Hostel"
  | "Tagore"
  | "Ramanujan Hostel(OH)"
  | "Lake View Hostel"
  | "Annexe"
  | "Tata Hall"
  | "Others";

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// Row shapes -- hand-written mirrors of the Postgres tables (see
// supabase/migrations/). Once `npm run db:types` has been run against a
// migrated database, these can be replaced with
// Database["public"]["Tables"][...]["Row"] for compiler-verified accuracy.

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  year: 1 | 2 | null;
  hostel: Hostel | null;
  specialization: string | null;
  bio: string | null;
  contact_number: string | null;
  room_number: string | null;
  google_calendar_connected: boolean;
  is_admin: boolean;
  tags: string[];
  rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaseRow {
  id: string;
  title: string;
  difficulty: Difficulty;
  type: CaseType;
  industry: Industry;
  company: string;
  framework: string[];
  casebook: string | null;
  description: string;
  estimated_time: number;
  tags: string[];
  created_by: string | null;
  created_at: string;
}

export interface CaseCommentRow {
  id: string;
  case_id: string;
  author_id: string | null;
  author_name: string;
  author_year: number | null;
  approach_title: string;
  content: string;
  created_at: string;
}

export interface MaterialRow {
  id: string;
  title: string;
  description: string;
  category: MaterialCategory;
  file_type: FileType;
  file_path: string | null;
  uploaded_by_label: string | null;
  created_by: string | null;
  tags: string[];
  created_at: string;
}

export interface AvailabilitySlotRow {
  id: string;
  profile_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  location: SlotLocation;
  created_at: string;
}

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";

export interface BookingRow {
  id: string;
  slot_id: string;
  booked_by: string;
  status: BookingStatus;
  booked_at: string;
  cancelled_at: string | null;
  google_event_id: string | null;
}
