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
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
        }
        Insert: {
          address: string
          allergens?: string[]
          category?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deadline: string
          delivered_at?: string | null
          delivery_requested?: boolean
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
          volunteer_accepted_at?: string | null
          volunteer_id?: string | null
        }
        Update: {
          address?: string
          allergens?: string[]
          category?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deadline?: string
          delivered_at?: string | null
          delivery_requested?: boolean
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
          volunteer_accepted_at?: string | null
          volunteer_id?: string | null
        }
        Relationships: []
      }
      food_requests: {
        Row: {
          address: string
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          fulfilled_donation_id: string | null
          id: string
          meals_needed: number
          needed_by: string
          notes: string | null
          receiver_id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          veg_only: boolean
        }
        Insert: {
          address: string
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          fulfilled_donation_id?: string | null
          id?: string
          meals_needed?: number
          needed_by: string
          notes?: string | null
          receiver_id: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          veg_only?: boolean
        }
        Update: {
          address?: string
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          fulfilled_donation_id?: string | null
          id?: string
          meals_needed?: number
          needed_by?: string
          notes?: string | null
          receiver_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          veg_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "food_requests_fulfilled_donation_id_fkey"
            columns: ["fulfilled_donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          donation_id: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          donation_id: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          donation_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
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
      pickup_codes: {
        Row: {
          code: string
          created_at: string
          donation_id: string
        }
        Insert: {
          code: string
          created_at?: string
          donation_id: string
        }
        Update: {
          code?: string
          created_at?: string
          donation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_codes_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
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
      accept_delivery: {
        Args: { _donation_id: string }
        Returns: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_delivery: {
        Args: { _donation_id: string }
        Returns: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_request: {
        Args: { _request_id: string }
        Returns: {
          address: string
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          fulfilled_donation_id: string | null
          id: string
          meals_needed: number
          needed_by: string
          notes: string | null
          receiver_id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          veg_only: boolean
        }
        SetofOptions: {
          from: "*"
          to: "food_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_pickup_with_code: {
        Args: { _code: string; _donation_id: string }
        Returns: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_stale_donations: { Args: never; Returns: undefined }
      fulfill_request: {
        Args: { _donation_id?: string; _request_id: string }
        Returns: {
          address: string
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          fulfilled_donation_id: string | null
          id: string
          meals_needed: number
          needed_by: string
          notes: string | null
          receiver_id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          veg_only: boolean
        }
        SetofOptions: {
          from: "*"
          to: "food_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_pickup_code: { Args: { _donation_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["account_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_donation_participant: {
        Args: { _donation_id: string; _user_id: string }
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
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "donations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_delivery: {
        Args: { _donation_id: string }
        Returns: {
          address: string
          allergens: string[]
          category: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deadline: string
          delivered_at: string | null
          delivery_requested: boolean
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
          volunteer_accepted_at: string | null
          volunteer_id: string | null
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
      request_status: "OPEN" | "FULFILLED" | "CANCELLED"
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
      request_status: ["OPEN", "FULFILLED", "CANCELLED"],
    },
  },
} as const
