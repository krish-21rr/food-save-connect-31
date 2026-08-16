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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      donations: {
        Row: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          donor_id: string
          expired_at: string | null
          id: string
          image_urls: string[]
          notes: string | null
          picked_up_at: string | null
          quantity: string
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at: string
          veg: boolean
        }
        Insert: {
          address: string
          allergens?: string[]
          category?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deadline: string
          donor_id: string
          expired_at?: string | null
          id?: string
          image_urls?: string[]
          notes?: string | null
          picked_up_at?: string | null
          quantity: string
          status?: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at?: string
          veg?: boolean
        }
        Update: {
          address?: string
          allergens?: string[]
          category?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deadline?: string
          donor_id?: string
          expired_at?: string | null
          id?: string
          image_urls?: string[]
          notes?: string | null
          picked_up_at?: string | null
          quantity?: string
          status?: Database["public"]["Enums"]["donation_status"]
          title?: string
          updated_at?: string
          veg?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          donation_id: string | null
          id: string
          message: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          donation_id?: string | null
          id?: string
          message: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          donation_id?: string | null
          id?: string
          message?: string
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          org_name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          org_name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          org_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["account_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["account_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["account_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_donation: {
        Args: { _donation_id: string }
        Returns: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          donor_id: string
          expired_at: string | null
          id: string
          image_urls: string[]
          notes: string | null
          picked_up_at: string | null
          quantity: string
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at: string
          veg: boolean
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_stale_donations: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["account_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_picked_up: {
        Args: { _donation_id: string }
        Returns: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          donor_id: string
          expired_at: string | null
          id: string
          image_urls: string[]
          notes: string | null
          picked_up_at: string | null
          quantity: string
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at: string
          veg: boolean
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_role: "donor" | "receiver" | "volunteer"
      donation_status: "AVAILABLE" | "CLAIMED" | "PICKED_UP" | "EXPIRED"
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
      account_role: ["donor", "receiver", "volunteer"],
      donation_status: ["AVAILABLE", "CLAIMED", "PICKED_UP", "EXPIRED"],
    },
  },
} as const
