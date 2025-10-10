import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          role: 'USER' | 'MANAGER' | 'ADMIN';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      vehicles: {
        Row: {
          id: string;
          plate: string;
          brand: string;
          model: string;
          year: number;
          initial_mileage: number;
          current_mileage: number;
          acquisition_date: string;
          chassis: string | null;
          renavam: string | null;
          color: string | null;
          fuel_type: string | null;
          tank_capacity: number | null;
          photo_url: string | null;
          active: boolean;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          category: 'FUEL' | 'MAINTENANCE_PREVENTIVE' | 'MAINTENANCE_CORRECTIVE' | 'FINE' | 'TOLL_PARKING' | 'INSURANCE_TAXES' | 'OTHER';
          amount: number;
          description: string | null;
          mileage: number | null;
          fuel_type: string | null;
          fuel_quantity: number | null;
          price_per_liter: number | null;
          service_name: string | null;
          provider: string | null;
          invoice_url: string | null;
          vehicle_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          title: string;
          message: string;
          severity: 'INFO' | 'WARNING' | 'CRITICAL';
          status: 'PENDING' | 'VIEWED' | 'RESOLVED';
          due_date: string | null;
          due_mileage: number | null;
          viewed_at: string | null;
          resolved_at: string | null;
          vehicle_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
    };
  };
};
