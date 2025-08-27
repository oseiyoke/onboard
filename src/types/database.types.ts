export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      onboard_organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
          settings: Json
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
          settings?: Json
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
          settings?: Json
        }
      }
      onboard_users: {
        Row: {
          id: string
          org_id: string
          email: string
          role: 'admin' | 'participant'
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          org_id: string
          email: string
          role: 'admin' | 'participant'
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          email?: string
          role?: 'admin' | 'participant'
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      onboard_flows: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          flow_data: Json
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          flow_data: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          flow_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      onboard_content: {
        Row: {
          id: string
          org_id: string
          name: string
          type: 'pdf' | 'video' | 'document' | 'image'
          file_url: string
          file_size: number
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          type: 'pdf' | 'video' | 'document' | 'image'
          file_url: string
          file_size: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          type?: 'pdf' | 'video' | 'document' | 'image'
          file_url?: string
          file_size?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      onboard_assessments: {
        Row: {
          id: string
          org_id: string
          flow_id: string
          phase_id: string
          questions: Json
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          org_id: string
          flow_id: string
          phase_id: string
          questions: Json
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          org_id?: string
          flow_id?: string
          phase_id?: string
          questions?: Json
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      onboard_participant_progress: {
        Row: {
          id: string
          org_id: string
          participant_id: string
          flow_id: string
          current_phase: string | null
          completed_phases: string[]
          assessment_scores: Json
          started_at: string
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          participant_id: string
          flow_id: string
          current_phase?: string | null
          completed_phases?: string[]
          assessment_scores?: Json
          started_at?: string
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          participant_id?: string
          flow_id?: string
          current_phase?: string | null
          completed_phases?: string[]
          assessment_scores?: Json
          started_at?: string
          completed_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'participant'
      content_type: 'pdf' | 'video' | 'document' | 'image' | 'other'
    }
  }
}
