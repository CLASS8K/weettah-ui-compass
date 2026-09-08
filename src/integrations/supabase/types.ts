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
      integration_settings: {
        Row: {
          api_base_url: string | null
          created_at: string
          credential_hint: string | null
          encrypted_credentials: string | null
          environment: string
          id: string
          notification_id: string | null
          provider_name: string
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          created_at?: string
          credential_hint?: string | null
          encrypted_credentials?: string | null
          environment?: string
          id: string
          notification_id?: string | null
          provider_name: string
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          created_at?: string
          credential_hint?: string | null
          encrypted_credentials?: string | null
          environment?: string
          id?: string
          notification_id?: string | null
          provider_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          activation_code: string | null
          activation_token: string
          amount_minor: number
          apn: string | null
          confirmation_code: string | null
          country: string
          created_at: string
          currency: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string
          data_allowance: string
          esim_transaction_no: string | null
          fulfilled_at: string | null
          fulfillment_error: string | null
          fulfillment_status: string
          iccid: string | null
          id: string
          merchant_reference: string
          payment_method: string | null
          pesapal_order_tracking_id: string | null
          plan_id: string | null
          provider_status_description: string | null
          qr_code_url: string | null
          status: string
          supplier_order_no: string | null
          updated_at: string
          validity_days: number
        }
        Insert: {
          activation_code?: string | null
          activation_token?: string
          amount_minor: number
          apn?: string | null
          confirmation_code?: string | null
          country: string
          created_at?: string
          currency?: string
          customer_email: string
          customer_first_name: string
          customer_last_name: string
          customer_phone: string
          data_allowance: string
          esim_transaction_no?: string | null
          fulfilled_at?: string | null
          fulfillment_error?: string | null
          fulfillment_status?: string
          iccid?: string | null
          id?: string
          merchant_reference: string
          payment_method?: string | null
          pesapal_order_tracking_id?: string | null
          plan_id?: string | null
          provider_status_description?: string | null
          qr_code_url?: string | null
          status?: string
          supplier_order_no?: string | null
          updated_at?: string
          validity_days: number
        }
        Update: {
          activation_code?: string | null
          activation_token?: string
          amount_minor?: number
          apn?: string | null
          confirmation_code?: string | null
          country?: string
          created_at?: string
          currency?: string
          customer_email?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_phone?: string
          data_allowance?: string
          esim_transaction_no?: string | null
          fulfilled_at?: string | null
          fulfillment_error?: string | null
          fulfillment_status?: string
          iccid?: string | null
          id?: string
          merchant_reference?: string
          payment_method?: string | null
          pesapal_order_tracking_id?: string | null
          plan_id?: string | null
          provider_status_description?: string | null
          qr_code_url?: string | null
          status?: string
          supplier_order_no?: string | null
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      plans: {
        Row: {
          amount_minor: number
          country: string
          created_at: string
          currency: string
          data_allowance: string
          display_order: number
          flag: string
          id: string
          is_active: boolean
          is_popular: boolean
          region: string
          supplier_package_code: string | null
          updated_at: string
          validity_days: number
        }
        Insert: {
          amount_minor: number
          country: string
          created_at?: string
          currency?: string
          data_allowance: string
          display_order?: number
          flag: string
          id: string
          is_active?: boolean
          is_popular?: boolean
          region: string
          supplier_package_code?: string | null
          updated_at?: string
          validity_days: number
        }
        Update: {
          amount_minor?: number
          country?: string
          created_at?: string
          currency?: string
          data_allowance?: string
          display_order?: number
          flag?: string
          id?: string
          is_active?: boolean
          is_popular?: boolean
          region?: string
          supplier_package_code?: string | null
          updated_at?: string
          validity_days?: number
        }
        Relationships: []
      }
      supported_devices: {
        Row: {
          brand: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          models: string
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          models: string
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          models?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "supplier_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["supplier_admin"],
    },
  },
} as const
