export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          location: Database["public"]["Enums"]["slot_location"]
          profile_id: string
          slot_date: string
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          location: Database["public"]["Enums"]["slot_location"]
          profile_id: string
          slot_date: string
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          location?: Database["public"]["Enums"]["slot_location"]
          profile_id?: string
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_at: string
          booked_by: string
          cancelled_at: string | null
          google_event_id: string | null
          id: string
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booked_at?: string
          booked_by: string
          cancelled_at?: string | null
          google_event_id?: string | null
          id?: string
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booked_at?: string
          booked_by?: string
          cancelled_at?: string | null
          google_event_id?: string | null
          id?: string
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "bookings_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      case_comment_upvotes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_comment_upvotes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "case_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_comment_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_comments: {
        Row: {
          approach_title: string
          author_id: string | null
          author_name: string
          author_year: number | null
          case_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          approach_title: string
          author_id?: string | null
          author_name: string
          author_year?: number | null
          case_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          approach_title?: string
          author_id?: string | null
          author_name?: string
          author_year?: number | null
          case_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_comments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_solves: {
        Row: {
          case_id: string
          id: string
          solved_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          id?: string
          solved_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          id?: string
          solved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_solves_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_solves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          casebook: string | null
          company: string
          created_at: string
          created_by: string | null
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          estimated_time: number
          framework: string[]
          id: string
          industry: Database["public"]["Enums"]["industry"]
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["case_type"]
        }
        Insert: {
          casebook?: string | null
          company: string
          created_at?: string
          created_by?: string | null
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          estimated_time: number
          framework?: string[]
          id?: string
          industry: Database["public"]["Enums"]["industry"]
          tags?: string[]
          title: string
          type: Database["public"]["Enums"]["case_type"]
        }
        Update: {
          casebook?: string | null
          company?: string
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          estimated_time?: number
          framework?: string[]
          id?: string
          industry?: Database["public"]["Enums"]["industry"]
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["case_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          profile_id: string
          refresh_token: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          refresh_token: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          refresh_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_downloads: {
        Row: {
          downloaded_at: string
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_downloads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: Database["public"]["Enums"]["material_category"]
          created_at: string
          created_by: string | null
          description: string
          file_path: string | null
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          tags: string[]
          title: string
          uploaded_by_label: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["material_category"]
          created_at?: string
          created_by?: string | null
          description: string
          file_path?: string | null
          file_type: Database["public"]["Enums"]["file_type"]
          id?: string
          tags?: string[]
          title: string
          uploaded_by_label?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["material_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          file_path?: string | null
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          tags?: string[]
          title?: string
          uploaded_by_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_number: string | null
          created_at: string
          email: string
          full_name: string | null
          google_calendar_connected: boolean
          hostel: Database["public"]["Enums"]["hostel"] | null
          id: string
          rating: number | null
          review_count: number
          room_number: string | null
          specialization: string | null
          tags: string[]
          updated_at: string
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_number?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          google_calendar_connected?: boolean
          hostel?: Database["public"]["Enums"]["hostel"] | null
          id: string
          rating?: number | null
          review_count?: number
          room_number?: string | null
          specialization?: string | null
          tags?: string[]
          updated_at?: string
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_number?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          google_calendar_connected?: boolean
          hostel?: Database["public"]["Enums"]["hostel"] | null
          id?: string
          rating?: number | null
          review_count?: number
          room_number?: string | null
          specialization?: string | null
          tags?: string[]
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_booking: {
        Args: { p_booking_id: string }
        Returns: {
          booked_at: string
          booked_by: string
          cancelled_at: string | null
          google_event_id: string | null
          id: string
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      booked_slot_ids: {
        Args: never
        Returns: {
          slot_id: string
        }[]
      }
      calculate_streak: { Args: { p_user_id?: string }; Returns: number }
      cancel_booking: { Args: { p_booking_id: string }; Returns: undefined }
      case_solved_counts: {
        Args: never
        Returns: {
          case_id: string
          solved_count: number
        }[]
      }
      decline_booking: {
        Args: { p_booking_id: string }
        Returns: {
          booked_at: string
          booked_by: string
          cancelled_at: string | null
          google_event_id: string | null
          id: string
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leaderboard: {
        Args: never
        Returns: {
          rank: number
          total_solved: number
          total_students: number
          user_id: string
        }[]
      }
      request_booking: {
        Args: { p_slot_id: string }
        Returns: {
          booked_at: string
          booked_by: string
          cancelled_at: string | null
          google_event_id: string | null
          id: string
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "declined" | "cancelled"
      case_type:
        | "Guesstimate"
        | "Profitability"
        | "Market Entry"
        | "M&A"
        | "Operations"
        | "Pricing"
        | "Growth Strategy"
        | "Cost Reduction"
      difficulty: "Easy" | "Medium" | "Hard"
      file_type: "PDF" | "Video" | "Article"
      hostel:
        | "New Hostel"
        | "Tagore"
        | "Ramanujan Hostel(OH)"
        | "Lake View Hostel"
        | "Annexe"
        | "Tata Hall"
        | "Others"
      industry:
        | "Consulting"
        | "Healthcare"
        | "Technology"
        | "Finance"
        | "Retail"
        | "Manufacturing"
        | "FMCG"
        | "Education"
        | "Energy"
        | "Telecom"
      material_category: "Framework" | "Industry Note" | "Skill" | "Casebook"
      slot_location: "NH" | "OH" | "Annexe" | "Library" | "LVH" | "Tagore"
      weekday:
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday"
        | "Sunday"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "declined", "cancelled"],
      case_type: [
        "Guesstimate",
        "Profitability",
        "Market Entry",
        "M&A",
        "Operations",
        "Pricing",
        "Growth Strategy",
        "Cost Reduction",
      ],
      difficulty: ["Easy", "Medium", "Hard"],
      file_type: ["PDF", "Video", "Article"],
      hostel: [
        "New Hostel",
        "Tagore",
        "Ramanujan Hostel(OH)",
        "Lake View Hostel",
        "Annexe",
        "Tata Hall",
        "Others",
      ],
      industry: [
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
      ],
      material_category: ["Framework", "Industry Note", "Skill", "Casebook"],
      slot_location: ["NH", "OH", "Annexe", "Library", "LVH", "Tagore"],
      weekday: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
  },
} as const
