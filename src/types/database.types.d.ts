// Ambient declaration for Supabase generated types.
// Overwrite by running locally:
// supabase gen types typescript --project-id ofkfygqrfenctzitigae > src/types/database.types.d.ts

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
          lastUpdated: string | null; // newly added / normalized
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
