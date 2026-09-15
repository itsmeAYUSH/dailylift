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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string
          slug: string | null
          name: string
          primary_muscle: string
          secondary_muscles: string[]
          equipment: string
          exercise_type: string
          movement_pattern: string | null
          difficulty: string
          environment: string
          instructions: string[]
          common_mistakes: string[]
          safety_notes: string | null
          is_unilateral: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug?: string | null
          name: string
          primary_muscle: string
          secondary_muscles?: string[]
          equipment?: string
          exercise_type?: string
          movement_pattern?: string | null
          difficulty?: string
          environment?: string
          instructions?: string[]
          common_mistakes?: string[]
          safety_notes?: string | null
          is_unilateral?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string | null
          name?: string
          primary_muscle?: string
          secondary_muscles?: string[]
          equipment?: string
          exercise_type?: string
          movement_pattern?: string | null
          difficulty?: string
          environment?: string
          instructions?: string[]
          common_mistakes?: string[]
          safety_notes?: string | null
          is_unilateral?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      workout_plan_days: {
        Row: {
          id: string
          plan_id: string
          day_index: number
          name: string
          focus: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          day_index?: number
          name: string
          focus?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          day_index?: number
          name?: string
          focus?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_exercises: {
        Row: {
          id: string
          plan_day_id: string
          exercise_id: string | null
          name: string
          order_index: number
          target_sets: number | null
          target_reps_min: number | null
          target_reps_max: number | null
          rest_seconds: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_day_id: string
          exercise_id?: string | null
          name: string
          order_index?: number
          target_sets?: number | null
          target_reps_min?: number | null
          target_reps_max?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_day_id?: string
          exercise_id?: string | null
          name?: string
          order_index?: number
          target_sets?: number | null
          target_reps_min?: number | null
          target_reps_max?: number | null
          rest_seconds?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_exercises_plan_day_id_fkey"
            columns: ["plan_day_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planned_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          plan_day_id: string | null
          name: string
          status: string
          started_at: string
          completed_at: string | null
          duration_seconds: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          plan_day_id?: string | null
          name?: string
          status?: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          plan_day_id?: string | null
          name?: string
          status?: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string | null
          name: string
          muscle_group: string | null
          order_index: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id?: string | null
          name: string
          muscle_group?: string | null
          order_index?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string | null
          name?: string
          muscle_group?: string | null
          order_index?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          id: string
          workout_exercise_id: string
          set_index: number
          set_type: string
          weight_kg: number | null
          reps: number | null
          rpe: number | null
          is_completed: boolean
          rest_seconds: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_exercise_id: string
          set_index?: number
          set_type?: string
          weight_kg?: number | null
          reps?: number | null
          rpe?: number | null
          is_completed?: boolean
          rest_seconds?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_exercise_id?: string
          set_index?: number
          set_type?: string
          weight_kg?: number | null
          reps?: number | null
          rpe?: number | null
          is_completed?: boolean
          rest_seconds?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      body_weight_logs: {
        Row: {
          id: string
          user_id: string
          weight_kg: number
          logged_on: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight_kg: number
          logged_on?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight_kg?: number
          logged_on?: string
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          id: string
          user_id: string
          exercise_id: string | null
          exercise_name: string
          record_type: string
          value: number
          unit: string | null
          reps: number | null
          weight_kg: number | null
          workout_id: string | null
          achieved_on: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id?: string | null
          exercise_name: string
          record_type: string
          value: number
          unit?: string | null
          reps?: number | null
          weight_kg?: number | null
          workout_id?: string | null
          achieved_on?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string | null
          exercise_name?: string
          record_type?: string
          value?: number
          unit?: string | null
          reps?: number | null
          weight_kg?: number | null
          workout_id?: string | null
          achieved_on?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          id: string
          plan_data: Json
          plan_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_data: Json
          plan_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_data?: Json
          plan_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          available_time_minutes: number | null
          created_at: string | null
          dietary_preference: string | null
          fitness_goal: Database["public"]["Enums"]["fitness_goal"] | null
          fitness_level: Database["public"]["Enums"]["fitness_level"] | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
          workout_preference:
            | Database["public"]["Enums"]["workout_preference"]
            | null
        }
        Insert: {
          age?: number | null
          available_time_minutes?: number | null
          created_at?: string | null
          dietary_preference?: string | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
          workout_preference?:
            | Database["public"]["Enums"]["workout_preference"]
            | null
        }
        Update: {
          age?: number | null
          available_time_minutes?: number | null
          created_at?: string | null
          dietary_preference?: string | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"] | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
          workout_preference?:
            | Database["public"]["Enums"]["workout_preference"]
            | null
        }
        Relationships: []
      }
      progress_logs: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          meals_followed: boolean | null
          notes: string | null
          user_id: string
          weight_kg: number | null
          workout_completed: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date?: string
          meals_followed?: boolean | null
          notes?: string | null
          user_id: string
          weight_kg?: number | null
          workout_completed?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          meals_followed?: boolean | null
          notes?: string | null
          user_id?: string
          weight_kg?: number | null
          workout_completed?: boolean | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string | null
          id: string
          plan_data: Json | null
          user_id: string
          week_start_date: string | null
          name: string | null
          description: string | null
          goal: string | null
          days_per_week: number | null
          is_active: boolean
          is_archived: boolean
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_data?: Json | null
          user_id: string
          week_start_date?: string | null
          name?: string | null
          description?: string | null
          goal?: string | null
          days_per_week?: number | null
          is_active?: boolean
          is_archived?: boolean
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_data?: Json | null
          user_id?: string
          week_start_date?: string | null
          name?: string | null
          description?: string | null
          goal?: string | null
          days_per_week?: number | null
          is_active?: boolean
          is_archived?: boolean
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      fitness_goal:
        | "weight_loss"
        | "muscle_gain"
        | "endurance"
        | "flexibility"
        | "general_fitness"
      fitness_level: "beginner" | "intermediate" | "advanced"
      workout_preference: "home" | "gym" | "outdoor" | "mixed"
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
      fitness_goal: [
        "weight_loss",
        "muscle_gain",
        "endurance",
        "flexibility",
        "general_fitness",
      ],
      fitness_level: ["beginner", "intermediate", "advanced"],
      workout_preference: ["home", "gym", "outdoor", "mixed"],
    },
  },
} as const
