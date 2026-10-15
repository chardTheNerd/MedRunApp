# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MedRunApp

@AGENTS.md

## Environment
- Windows, Command Prompt. Node 22 (not Node 26: it breaks Expo config loading).
- Expo SDK 57, React Native, TypeScript.
- Install packages with `npx expo install`, never plain `npm install`.
- Check work with `npx tsc --noEmit` and report the result.

## Commands

- `npx expo start` — dev server; `--android` / `--ios` / `--web` to launch a platform (`npm run android|ios|web`).
- `npx expo install <package>` — adding deps (resolves SDK 57-compatible versions).
- `npx tsc --noEmit` — typecheck; run after each change and report the result.
- `npx expo lint` (`npm run lint`, eslint-config-expo flat config) — run before declaring a task done.
- `npx expo-doctor` / `npx expo install --fix` — diagnose and fix SDK version drift.
- No test runner is configured (no jest/vitest script in `package.json`); verification is `tsc` + `expo lint`.

## Architecture

Clean-architecture layers under `src/`: `core` → `domain` → `data` → `presentation`/`app`.

- Entry is `index.ts` → `App.tsx` → `AppProviders` → `BootstrapScreen`. Despite what
  `AGENTS.md` says about Expo Router, this repo has no `expo-router` dependency and `src/app/`
  holds only `di/container.ts` and `AppProviders.tsx` — there are no file-based routes yet.
- `src/app/di/container.ts` wires singleton repository impls to use cases
  (`RegisterPatient`, `SignInUser`, `SignOutUser`, `SearchNearbyListings`, `PlaceOrder`,
  `RequestConsultation`); providers in `src/presentation/providers/` consume the container.
- State is Provider + BLoC reducers via `src/presentation/bloc/createBloc.tsx`
  (`useReducer` + state/dispatch contexts).
- Data flow per feature: Supabase connector (`src/data/supabase/connectors/*`) → repository impl
  (`src/data/repositories/*Impl.ts`, converts throws to `Result<T>` with `wrap`) → domain use
  case (`execute`). Note: connectors import `throwIfError`/`mapAuthError` helpers that do not
  exist yet — `errors.ts` currently only exports `toAppError` — so `npx tsc --noEmit` fails;
  this is known in-progress migration breakage, not something to fix opportunistically.
- `Result<T>` (`src/core/types/result.ts`) is `{ ok: true; value } | { ok: false; error: AppError }`;
  errors are `AppError` codes (`src/core/errors/AppError.ts`). Connectors throw, repositories wrap.
- Supabase schema mapping: `tables.ts` (table names) → `rows.ts` (row shapes) → `mappers.ts`
  (row ↔ domain entity), typed by `Database.ts`. Geo (geohash, `distanceKm`) is shared from
  `src/data/firebase/geo.ts`; nearby search is currently a client-side radius filter over
  available listings (see the PostGIS note in the inventory connector).
- Nigeria defaults live in `app.json` `extra` + `src/core/config/env.ts`
  (`EXPO_PUBLIC_*` overrides): NG / NGN (prices in kobo via `core/utils/money.ts`) / en-NG /
  Africa/Lagos; `core/config/nigeria.ts`, `core/utils/phoneNg.ts`.

## Data layer
- Migrating from Firebase to Supabase. Supabase client: src/data/supabase/SupabaseClient.ts.
- Env vars are EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
- Only the anon key belongs in the app. Never use a service_role or secret key.

## Rules
- Before editing any file in src/data/supabase, read it and the files that import it.
- Never overwrite an existing file wholesale. Make targeted edits.
- Do not delete files. Do not touch .env.
- Change one connector at a time. Run `npx tsc --noEmit` after each.