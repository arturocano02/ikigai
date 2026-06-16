export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          gdpr_consent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          gdpr_consent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          gdpr_consent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ikigai_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subtitle: string | null;
          synthesis: Json;
          conversation_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          subtitle?: string | null;
          synthesis: Json;
          conversation_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          synthesis?: Json;
          conversation_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
