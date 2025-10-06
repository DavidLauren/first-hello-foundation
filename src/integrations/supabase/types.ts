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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          table_name: string
          target_user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          table_name: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          table_name?: string
          target_user_id?: string
        }
        Relationships: []
      }
      admin_charges: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          invoice_id: string | null
          paid_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_charges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_charges_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "deferred_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_charges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_info: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          siret: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          siret?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      deferred_invoices: {
        Row: {
          archived_at: string | null
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_number: string
          issued_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_number: string
          issued_date?: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issued_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivered_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          order_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          order_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          order_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivered_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      examples: {
        Row: {
          after_image_url: string
          before_image_url: string
          category: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          after_image_url: string
          before_image_url: string
          category: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string
          before_image_url?: string
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_image_pairs: {
        Row: {
          after_image_url: string
          before_image_url: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          after_image_url: string
          before_image_url: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string
          before_image_url?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          order_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "deferred_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_original: boolean
          order_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_original?: boolean
          order_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_original?: boolean
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          id: string
          instructions: string | null
          invoiced_at: string | null
          order_number: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          instructions?: string | null
          invoiced_at?: string | null
          order_number: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          instructions?: string | null
          invoiced_at?: string | null
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          billing_address: string | null
          billing_company: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          deferred_billing_enabled: boolean
          email: string
          first_name: string | null
          id: string
          is_vip: boolean
          last_name: string | null
          phone: string | null
          updated_at: string
          vip_activated_at: string | null
          vip_activated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          billing_address?: string | null
          billing_company?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          deferred_billing_enabled?: boolean
          email: string
          first_name?: string | null
          id: string
          is_vip?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          vip_activated_at?: string | null
          vip_activated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          billing_address?: string | null
          billing_company?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          deferred_billing_enabled?: boolean
          email?: string
          first_name?: string | null
          id?: string
          is_vip?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          vip_activated_at?: string | null
          vip_activated_by?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          free_photos: number
          id: string
          max_uses: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          free_photos?: number
          id?: string
          max_uses?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          free_photos?: number
          id?: string
          max_uses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_reward_amount: number | null
          referrer_id: string
          referrer_reward_amount: number | null
          reward_given_to_referred: boolean
          reward_given_to_referrer: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_reward_amount?: number | null
          referrer_id: string
          referrer_reward_amount?: number | null
          reward_given_to_referred?: boolean
          reward_given_to_referrer?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_reward_amount?: number | null
          referrer_id?: string
          referrer_reward_amount?: number | null
          reward_given_to_referred?: boolean
          reward_given_to_referrer?: boolean
        }
        Relationships: []
      }
      user_promo_usage: {
        Row: {
          id: string
          photos_remaining: number | null
          photos_used: number | null
          promo_code_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          photos_remaining?: number | null
          photos_used?: number | null
          promo_code_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          photos_remaining?: number | null
          photos_used?: number | null
          promo_code_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_promo_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      apply_promo_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      apply_referral_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      create_user_referral_code: {
        Args: { _user_id: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_free_photos: {
        Args: { _user_id: string }
        Returns: number
      }
      get_user_referral_stats: {
        Args: { _user_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
    },
  },
} as const
