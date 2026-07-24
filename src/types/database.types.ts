export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      booking_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          booking_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          new_state: string | null
          previous_state: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: string
          booking_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          new_state?: string | null
          previous_state?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          booking_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          new_state?: string | null
          previous_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_amount_paise: number
          balance_amount_paise: number
          booking_reference: string
          booking_status: Database["public"]["Enums"]["booking_status"]
          booking_type: string
          cancelled_at: string | null
          check_in_at: string
          check_out_at: string
          created_at: string
          customer_email_snapshot: string | null
          customer_id: string | null
          customer_name_snapshot: string
          customer_phone_snapshot: string
          guest_count: number
          hold_request_id: string | null
          hold_token_nonce: string | null
          id: string
          overnight_guest_count: number | null
          property_id: string
          public_confirmation_token: string
          request_fingerprint_hash: string | null
          source: string
          special_requests: string | null
          total_amount_paise: number
          updated_at: string
        }
        Insert: {
          advance_amount_paise: number
          balance_amount_paise: number
          booking_reference: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          booking_type: string
          cancelled_at?: string | null
          check_in_at: string
          check_out_at: string
          created_at?: string
          customer_email_snapshot?: string | null
          customer_id?: string | null
          customer_name_snapshot: string
          customer_phone_snapshot: string
          guest_count: number
          hold_request_id?: string | null
          hold_token_nonce?: string | null
          id?: string
          overnight_guest_count?: number | null
          property_id: string
          public_confirmation_token: string
          request_fingerprint_hash?: string | null
          source: string
          special_requests?: string | null
          total_amount_paise: number
          updated_at?: string
        }
        Update: {
          advance_amount_paise?: number
          balance_amount_paise?: number
          booking_reference?: string
          booking_status?: Database["public"]["Enums"]["booking_status"]
          booking_type?: string
          cancelled_at?: string | null
          check_in_at?: string
          check_out_at?: string
          created_at?: string
          customer_email_snapshot?: string | null
          customer_id?: string | null
          customer_name_snapshot?: string
          customer_phone_snapshot?: string
          guest_count?: number
          hold_request_id?: string | null
          hold_token_nonce?: string | null
          id?: string
          overnight_guest_count?: number | null
          property_id?: string
          public_confirmation_token?: string
          request_fingerprint_hash?: string | null
          source?: string
          special_requests?: string | null
          total_amount_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      inventory_reservations: {
        Row: {
          booking_id: string | null
          created_at: string
          end_at: string
          expires_at: string | null
          external_reservation_id: string | null
          id: string
          property_id: string
          reservation_type: Database["public"]["Enums"]["reservation_type"]
          source: string
          start_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          end_at: string
          expires_at?: string | null
          external_reservation_id?: string | null
          id?: string
          property_id: string
          reservation_type: Database["public"]["Enums"]["reservation_type"]
          source: string
          start_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          end_at?: string
          expires_at?: string | null
          external_reservation_id?: string | null
          id?: string
          property_id?: string
          reservation_type?: Database["public"]["Enums"]["reservation_type"]
          source?: string
          start_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          attempt_count: number
          booking_id: string | null
          channel: string
          created_at: string
          id: string
          last_error: string | null
          provider_message_id: string | null
          recipient_hash: string
          recipient_masked: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_key: string
        }
        Insert: {
          attempt_count?: number
          booking_id?: string | null
          channel: string
          created_at?: string
          id?: string
          last_error?: string | null
          provider_message_id?: string | null
          recipient_hash: string
          recipient_masked?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key: string
        }
        Update: {
          attempt_count?: number
          booking_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          last_error?: string | null
          provider_message_id?: string | null
          recipient_hash?: string
          recipient_masked?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          attempt_expires_at: string | null
          authorized_at: string | null
          booking_id: string
          captured_at: string | null
          checkout_started_at: string | null
          created_at: string
          currency: string
          failed_at: string | null
          failure_code: string | null
          failure_reason: string | null
          id: string
          idempotency_key: string
          last_provider_event_id: string | null
          order_created_at: string | null
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          provider_receipt: string | null
          recovery_reason: string | null
          recovery_required_at: string | null
          signature_verified: boolean
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          verification_source: string | null
          verified_at: string | null
        }
        Insert: {
          amount_paise: number
          attempt_expires_at?: string | null
          authorized_at?: string | null
          booking_id: string
          captured_at?: string | null
          checkout_started_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          idempotency_key: string
          last_provider_event_id?: string | null
          order_created_at?: string | null
          provider: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_receipt?: string | null
          recovery_reason?: string | null
          recovery_required_at?: string | null
          signature_verified?: boolean
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verification_source?: string | null
          verified_at?: string | null
        }
        Update: {
          amount_paise?: number
          attempt_expires_at?: string | null
          authorized_at?: string | null
          booking_id?: string
          captured_at?: string | null
          checkout_started_at?: string | null
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          idempotency_key?: string
          last_provider_event_id?: string | null
          order_created_at?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_receipt?: string | null
          recovery_reason?: string | null
          recovery_required_at?: string | null
          signature_verified?: boolean
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          verification_source?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          advance_amount_paise: number
          created_at: string
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean
          price_amount_paise: number
          priority: number
          property_id: string
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          specific_date: string | null
          updated_at: string
        }
        Insert: {
          advance_amount_paise: number
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean
          price_amount_paise: number
          priority?: number
          property_id: string
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          specific_date?: string | null
          updated_at?: string
        }
        Update: {
          advance_amount_paise?: number
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean
          price_amount_paise?: number
          priority?: number
          property_id?: string
          rule_type?: Database["public"]["Enums"]["pricing_rule_type"]
          specific_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          check_in_time: string
          check_out_time: string
          cleaning_buffer_minutes: number
          created_at: string
          id: string
          is_active: boolean
          max_event_guests: number
          max_overnight_guests: number
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          check_in_time: string
          check_out_time: string
          cleaning_buffer_minutes: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_event_guests: number
          max_overnight_guests: number
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string
          cleaning_buffer_minutes?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_event_guests?: number
          max_overnight_guests?: number
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_sensitive?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["auth_user_id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          payload_hash: string
          payload_redacted: Json | null
          processed_at: string | null
          processing_status: Database["public"]["Enums"]["webhook_processing_status"]
          provider: string
          provider_event_id: string
          received_at: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          payload_hash: string
          payload_redacted?: Json | null
          processed_at?: string | null
          processing_status?: Database["public"]["Enums"]["webhook_processing_status"]
          provider: string
          provider_event_id: string
          received_at?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          payload_hash?: string
          payload_redacted?: Json | null
          processed_at?: string | null
          processing_status?: Database["public"]["Enums"]["webhook_processing_status"]
          provider?: string
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_provider_order: {
        Args: {
          p_amount_paise: number
          p_currency: string
          p_payment_id: string
          p_provider_order_id: string
        }
        Returns: Json
      }
      begin_payment_webhook: {
        Args: {
          p_event_type: string
          p_payload_hash: string
          p_payload_redacted: Json
          p_provider: string
          p_provider_event_id: string
        }
        Returns: Json
      }
      complete_payment_webhook: {
        Args: {
          p_error_category?: string
          p_processing_status: Database["public"]["Enums"]["webhook_processing_status"]
          p_provider: string
          p_provider_event_id: string
        }
        Returns: undefined
      }
      create_booking_hold: {
        Args: {
          p_check_in_date: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_fallback_hold_minutes: number
          p_guest_count: number
          p_hold_request_id: string
          p_hold_token_nonce: string
          p_overnight_guest_count: number
          p_property_slug: string
          p_request_fingerprint_hash: string
          p_special_requests: string
          p_whatsapp: string
        }
        Returns: Json
      }
      delete_setting: { Args: { p_setting_key: string }; Returns: boolean }
      expire_stale_holds: { Args: { p_property_id?: string }; Returns: number }
      finalize_verified_payment: {
        Args: {
          p_amount_paise: number
          p_currency: string
          p_financial_status: string
          p_provider: string
          p_provider_event_id?: string
          p_provider_order_id: string
          p_provider_payment_id: string
          p_verification_source: string
        }
        Returns: Json
      }
      get_monthly_availability: {
        Args: { p_month: string; p_property_slug: string }
        Returns: Json
      }
      has_admin_role: {
        Args: { required_roles: Database["public"]["Enums"]["admin_role"][] }
        Returns: boolean
      }
      is_active_admin: { Args: never; Returns: boolean }
      is_current_or_future_business_date: {
        Args: {
          p_business_date: string
          p_property_id: string
          p_reference_instant?: string
        }
        Returns: boolean
      }
      mark_payment_checkout_started: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      mark_payment_order_failed: {
        Args: { p_failure_category: string; p_payment_id: string }
        Returns: undefined
      }
      mark_provider_payment_failed: {
        Args: {
          p_provider: string
          p_provider_event_id?: string
          p_provider_order_id: string
          p_provider_payment_id: string
        }
        Returns: boolean
      }
      prepare_payment_order: {
        Args: {
          p_booking_id: string
          p_hold_token_nonce: string
          p_provider: string
        }
        Returns: Json
      }
      release_booking_hold: {
        Args: { p_booking_id: string; p_hold_token_nonce: string }
        Returns: boolean
      }
      resolve_booking_dates: {
        Args: { p_check_in_date: string; p_property_id: string }
        Returns: {
          business_date: string
          check_in_at: string
          check_in_time: string
          check_out_at: string
          check_out_time: string
          timezone: string
        }[]
      }
      resolve_booking_price: {
        Args: { p_business_date: string; p_property_id: string }
        Returns: {
          advance_amount_paise: number
          balance_amount_paise: number
          business_date: string
          currency: string
          price_amount_paise: number
          pricing_rule_id: string
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
        }[]
      }
      upsert_non_sensitive_setting: {
        Args: {
          p_description: string
          p_setting_key: string
          p_setting_value: Json
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "site_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_sensitive_setting: {
        Args: {
          p_description: string
          p_setting_key: string
          p_setting_value: Json
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_sensitive: boolean
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "site_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      admin_role: "super_admin" | "admin" | "operations"
      booking_status:
        | "draft"
        | "held"
        | "payment_pending"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "expired"
      notification_status: "pending" | "sent" | "failed"
      payment_status:
        | "not_started"
        | "order_created"
        | "checkout_started"
        | "pending"
        | "authorized"
        | "captured"
        | "verified"
        | "failed"
        | "expired"
        | "refund_pending"
        | "reconciliation_required"
        | "partially_refunded"
        | "refunded"
      pricing_rule_type: "weekday" | "weekend" | "special_date"
      reservation_status: "active" | "released" | "expired" | "cancelled"
      reservation_type:
        | "temporary_hold"
        | "confirmed_booking"
        | "manual_booking"
        | "ota_booking"
        | "owner_block"
        | "maintenance_block"
      webhook_processing_status: "pending" | "processed" | "failed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["super_admin", "admin", "operations"],
      booking_status: [
        "draft",
        "held",
        "payment_pending",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "expired",
      ],
      notification_status: ["pending", "sent", "failed"],
      payment_status: [
        "not_started",
        "order_created",
        "checkout_started",
        "pending",
        "authorized",
        "captured",
        "verified",
        "failed",
        "expired",
        "refund_pending",
        "reconciliation_required",
        "partially_refunded",
        "refunded",
      ],
      pricing_rule_type: ["weekday", "weekend", "special_date"],
      reservation_status: ["active", "released", "expired", "cancelled"],
      reservation_type: [
        "temporary_hold",
        "confirmed_booking",
        "manual_booking",
        "ota_booking",
        "owner_block",
        "maintenance_block",
      ],
      webhook_processing_status: ["pending", "processed", "failed"],
    },
  },
} as const

