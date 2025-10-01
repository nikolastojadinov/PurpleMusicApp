// Generated Supabase types placeholder.
// Run locally (where Supabase CLI is installed):
// supabase gen types typescript --project-id ofkfygqrfenctzitigae > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      playlists: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          cover_url: string | null;
          created_at: string | null;
          lastUpdated: string | null; // newly added column (camelCase)
          // If the real column is lastupdated (lowercase) adjust here.
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          cover_url?: string | null;
          created_at?: string | null;
          lastUpdated?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          cover_url?: string | null;
          created_at?: string | null;
          lastUpdated?: string | null;
        };
      };
    };
  };
}

export type PlaylistsRow = Database['public']['Tables']['playlists']['Row'];
