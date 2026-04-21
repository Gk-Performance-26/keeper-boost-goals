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
      badges: {
        Row: {
          color_token: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          slug: string
        }
        Insert: {
          color_token?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          requirement_type: string
          requirement_value?: number
          slug: string
        }
        Update: {
          color_token?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color_token: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color_token?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color_token?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      completed_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          notes: string | null
          rating: number | null
          training_id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          rating?: number | null
          training_id: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          rating?: number | null
          training_id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "completed_sessions_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_group: string | null
          avatar_url: string | null
          created_at: string
          current_level: number
          current_streak: number
          daily_xp_goal: number
          display_name: string | null
          dominant_hand: Database["public"]["Enums"]["dominant_hand"] | null
          experience_level: Database["public"]["Enums"]["experience_level"]
          freeze_tokens: number
          id: string
          last_training_date: string | null
          longest_streak: number
          onboarded: boolean
          playing_styles: string[]
          total_xp: number
          training_goal: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          avatar_url?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          daily_xp_goal?: number
          display_name?: string | null
          dominant_hand?: Database["public"]["Enums"]["dominant_hand"] | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          freeze_tokens?: number
          id?: string
          last_training_date?: string | null
          longest_streak?: number
          onboarded?: boolean
          playing_styles?: string[]
          total_xp?: number
          training_goal?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          avatar_url?: string | null
          created_at?: string
          current_level?: number
          current_streak?: number
          daily_xp_goal?: number
          display_name?: string | null
          dominant_hand?: Database["public"]["Enums"]["dominant_hand"] | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          freeze_tokens?: number
          id?: string
          last_training_date?: string | null
          longest_streak?: number
          onboarded?: boolean
          playing_styles?: string[]
          total_xp?: number
          training_goal?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_scores: {
        Row: {
          category_id: string
          id: string
          recorded_at: string
          score: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          id?: string
          recorded_at?: string
          score: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          id?: string
          recorded_at?: string
          score?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_scores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "completed_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          drills: Json
          duration_minutes: number
          equipment: string[] | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["experience_level"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_type: Database["public"]["Enums"]["video_source_type"]
          video_url: string
          xp_reward: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          drills?: Json
          duration_minutes?: number
          equipment?: string[] | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["experience_level"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_type?: Database["public"]["Enums"]["video_source_type"]
          video_url: string
          xp_reward?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          drills?: Json
          duration_minutes?: number
          equipment?: string[] | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["experience_level"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_type?: Database["public"]["Enums"]["video_source_type"]
          video_url?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "trainings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_count: number
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_count?: number
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_count?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          target_count: number
          title: string
          week_end: string
          week_start: string
          xp_bonus: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          target_count?: number
          title: string
          week_end: string
          week_start: string
          xp_bonus?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          target_count?: number
          title?: string
          week_end?: string
          week_start?: string
          xp_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      dominant_hand: "left" | "right" | "both"
      experience_level: "beginner" | "intermediate" | "advanced" | "pro"
      video_source_type: "upload" | "youtube" | "vimeo"
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
      dominant_hand: ["left", "right", "both"],
      experience_level: ["beginner", "intermediate", "advanced", "pro"],
      video_source_type: ["upload", "youtube", "vimeo"],
    },
  },
} as const
