// Supabase Database Types for StaffHub

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          type: 'GenzaiX' | 'Ukeoi';
          emp_id: string | null;
          full_name: string | null;
          full_name_kana: string | null;
          nationality: string | null;
          gender: string | null;
          birth_date: string | null;
          age: number | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          postal_code: string | null;
          station: string | null;
          visa_type: string | null;
          visa_expiry: string | null;
          residence_card: string | null;
          hire_date: string | null;
          status: string | null;
          hourly_wage: number | null;
          billing_unit: number | null;
          profit_margin: number | null;
          standard_remuneration: number | null;
          health_ins: number | null;
          nursing_ins: number | null;
          pension: number | null;
          employment_ins: number | null;
          is_shaku: boolean | null;
          bank_name: string | null;
          bank_branch: string | null;
          bank_account_type: string | null;
          bank_account_number: string | null;
          bank_account_holder: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          notes: string | null;
          resume_id: string | null;
          photo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['staff']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['staff']['Insert']>;
      };
      resumes: {
        Row: {
          id: string;
          applicant_id: string | null;
          full_name: string | null;
          full_name_kana: string | null;
          birth_date: string | null;
          age: number | null;
          gender: string | null;
          nationality: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          postal_code: string | null;
          photo: string | null;
          education: Json | null;
          job_history: Json | null;
          licenses: Json | null;
          skills: string | null;
          hobbies: string | null;
          motivation: string | null;
          requests: string | null;
          family: Json | null;
          commute_time: string | null;
          dependents: number | null;
          spouse: boolean | null;
          spouse_support: boolean | null;
          interview_result: string | null;
          interview_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resumes']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['resumes']['Insert']>;
      };
      applications: {
        Row: {
          id: string;
          resume_id: string | null;
          factory_name: string | null;
          position: string | null;
          status: string | null;
          applied_date: string | null;
          interview_date: string | null;
          start_date: string | null;
          hourly_wage: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
      };
      factories: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          contact_person: string | null;
          phone: string | null;
          billing_rate: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['factories']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['factories']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          display_name: string | null;
          email: string | null;
          role: string | null;
          avatar: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
    };
  };
}

// Helper types for easier use
export type Staff = Database['public']['Tables']['staff']['Row'];
export type StaffInsert = Database['public']['Tables']['staff']['Insert'];
export type Resume = Database['public']['Tables']['resumes']['Row'];
export type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
export type Application = Database['public']['Tables']['applications']['Row'];
export type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];
export type Factory = Database['public']['Tables']['factories']['Row'];
export type FactoryInsert = Database['public']['Tables']['factories']['Insert'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
