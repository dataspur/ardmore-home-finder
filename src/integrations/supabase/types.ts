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
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invited_by: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invited_by: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string
          status?: string | null
        }
        Relationships: []
      }
      admin_messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_mass_message: boolean | null
          sender_id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_mass_message?: boolean | null
          sender_id: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_mass_message?: boolean | null
          sender_id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          admin_reply: string | null
          admin_reply_at: string | null
          created_at: string
          data: Json
          form_type: Database["public"]["Enums"]["form_type"]
          id: string
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          created_at?: string
          data: Json
          form_type: Database["public"]["Enums"]["form_type"]
          id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          admin_reply_at?: string | null
          created_at?: string
          data?: Json
          form_type?: Database["public"]["Enums"]["form_type"]
          id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lease_documents: {
        Row: {
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          lease_id: string | null
          mime_type: string | null
          notes: string | null
          tenant_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          lease_id?: string | null
          mime_type?: string | null
          notes?: string | null
          tenant_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          lease_id?: string | null
          mime_type?: string | null
          notes?: string | null
          tenant_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          autopay_enabled: boolean | null
          created_at: string | null
          due_date: string
          id: string
          property_address: string
          rent_amount_cents: number
          status: string | null
          stripe_payment_method_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          unit_number: string | null
          updated_at: string | null
        }
        Insert: {
          autopay_enabled?: boolean | null
          created_at?: string | null
          due_date: string
          id?: string
          property_address: string
          rent_amount_cents: number
          status?: string | null
          stripe_payment_method_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          unit_number?: string | null
          updated_at?: string | null
        }
        Update: {
          autopay_enabled?: boolean | null
          created_at?: string | null
          due_date?: string
          id?: string
          property_address?: string
          rent_amount_cents?: number
          status?: string | null
          stripe_payment_method_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          unit_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_properties: {
        Row: {
          address: string
          created_at: string | null
          id: string
          notes: string | null
          total_units: number
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          notes?: string | null
          total_units?: number
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          total_units?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      message_recipients: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message_id: string
          read_at: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id: string
          read_at?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_id?: string
          read_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_recipients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_replies: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read_by_admin: boolean | null
          message_id: string
          tenant_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read_by_admin?: boolean | null
          message_id: string
          tenant_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read_by_admin?: boolean | null
          message_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          lease_id: string
          status: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          lease_id: string
          status?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          lease_id?: string
          status?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          unit_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          unit_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          unit_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          available_date: string | null
          badge: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          cooling_type: string | null
          created_at: string | null
          deposit_cents: number | null
          description: string | null
          garage_spaces: number | null
          heating_type: string | null
          hoa_fee_cents: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          lot_size_sqft: number | null
          pet_policy: string | null
          price_cents: number
          price_display: string
          property_subtype: string | null
          property_type: string
          size_sqft: number | null
          state: string | null
          title: string
          updated_at: string | null
          virtual_tour_url: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          address: string
          available_date?: string | null
          badge?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          cooling_type?: string | null
          created_at?: string | null
          deposit_cents?: number | null
          description?: string | null
          garage_spaces?: number | null
          heating_type?: string | null
          hoa_fee_cents?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          lot_size_sqft?: number | null
          pet_policy?: string | null
          price_cents: number
          price_display: string
          property_subtype?: string | null
          property_type: string
          size_sqft?: number | null
          state?: string | null
          title: string
          updated_at?: string | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          available_date?: string | null
          badge?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          cooling_type?: string | null
          created_at?: string | null
          deposit_cents?: number | null
          description?: string | null
          garage_spaces?: number | null
          heating_type?: string | null
          hoa_fee_cents?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          lot_size_sqft?: number | null
          pet_policy?: string | null
          price_cents?: number
          price_display?: string
          property_subtype?: string | null
          property_type?: string
          size_sqft?: number | null
          state?: string | null
          title?: string
          updated_at?: string | null
          virtual_tour_url?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          property_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          property_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          stripe_customer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_lease_details: { Args: { lookup_token: string }; Returns: Json }
      get_tenant_lease_by_user: {
        Args: { lookup_user_id: string }
        Returns: Json
      }
      get_tenant_payment_history: {
        Args: { lookup_token: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      form_type: "contact" | "maintenance" | "lease"
      submission_status: "pending" | "in_progress" | "completed" | "cancelled"
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
      app_role: ["admin", "user"],
      form_type: ["contact", "maintenance", "lease"],
      submission_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
