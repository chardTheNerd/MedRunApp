# MedRunApp

@AGENTS.md

## Environment
- Windows, Command Prompt. Node 22 (not Node 26: it breaks Expo config loading).
- Expo SDK 57, React Native, TypeScript.
- Install packages with `npx expo install`, never plain `npm install`.
- Check work with `npx tsc --noEmit` and report the result.

## Data layer
- Migrating from Firebase to Supabase. Supabase client: src/data/supabase/SupabaseClient.ts.
- Env vars are EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
- Only the anon key belongs in the app. Never use a service_role or secret key.

## Rules
- Before editing any file in src/data/supabase, read it and the files that import it.
- Never overwrite an existing file wholesale. Make targeted edits.
- Do not delete files. Do not touch .env.
- Change one connector at a time. Run `npx tsc --noEmit` after each.