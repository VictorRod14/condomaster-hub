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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          condominium_id: string
          content: string
          created_at: string | null
          id: string
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          condominium_id: string
          content: string
          created_at?: string | null
          id?: string
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          condominium_id?: string
          content?: string
          created_at?: string | null
          id?: string
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      common_areas: {
        Row: {
          active: boolean | null
          condominium_id: string
          created_at: string | null
          description: string | null
          id: string
          max_hours: number | null
          name: string
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          condominium_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          max_hours?: number | null
          name: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          condominium_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          max_hours?: number | null
          name?: string
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "common_areas_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condominiums: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          id: string
          name: string
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      financial_records: {
        Row: {
          amount: number
          condominium_id: string
          created_at: string | null
          description: string
          due_date: string
          id: string
          payment_date: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          condominium_id: string
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          payment_date?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          condominium_id?: string
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          payment_date?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          condominium_id: string
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          condominium_id: string
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          condominium_id?: string
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrences: {
        Row: {
          assigned_to: string | null
          category: string | null
          condominium_id: string
          created_at: string | null
          description: string
          id: string
          reporter_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["occurrence_status"]
          title: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          condominium_id: string
          created_at?: string | null
          description: string
          id?: string
          reporter_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          title: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          condominium_id?: string
          created_at?: string | null
          description?: string
          id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          title?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          condominium_id: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          condominium_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          condominium_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_condominium"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profiles_unit"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          common_area_id: string
          condominium_id: string
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          reservation_date: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          common_area_id: string
          condominium_id: string
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          reservation_date: string
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          common_area_id?: string
          condominium_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          reservation_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_common_area_id_fkey"
            columns: ["common_area_id"]
            isOneToOne: false
            referencedRelation: "common_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          block: string | null
          condominium_id: string
          created_at: string | null
          floor: number | null
          id: string
          number: string
          updated_at: string | null
        }
        Insert: {
          block?: string | null
          condominium_id: string
          created_at?: string | null
          floor?: number | null
          id?: string
          number: string
          updated_at?: string | null
        }
        Update: {
          block?: string | null
          condominium_id?: string
          created_at?: string | null
          floor?: number | null
          id?: string
          number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
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
      assign_multiple_roles_to_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      app_role: "admin" | "sindico" | "morador"
      occurrence_status: "aberta" | "em_andamento" | "resolvida" | "fechada"
      payment_status: "pago" | "pendente" | "atrasado"
      reservation_status: "pendente" | "confirmada" | "cancelada"
      user_role: "admin" | "sindico" | "morador"
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
      app_role: ["admin", "sindico", "morador"],
      occurrence_status: ["aberta", "em_andamento", "resolvida", "fechada"],
      payment_status: ["pago", "pendente", "atrasado"],
      reservation_status: ["pendente", "confirmada", "cancelada"],
      user_role: ["admin", "sindico", "morador"],
    },
  },
} as const
