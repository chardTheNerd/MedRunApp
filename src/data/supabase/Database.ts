// Database type for the Supabase client.
//
// Regenerate from your Supabase project with:
//   npx supabase gen types typescript --project-id <project-ref> --schema public > src/data/supabase/Database.ts
//
// Until then the index signature below keeps every `from(table)` call
// typechecking with `any` rows (see rows.ts for the real shapes).
export type Database = {
  public: {
    Tables: {
      [_ in string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      place_order: {
        Args: { p_order: Record<string, any> };
        Returns: Record<string, any>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
