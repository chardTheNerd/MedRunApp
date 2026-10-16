-- MedRun staff consultation access. Run once in the Supabase Dashboard:
-- SQL Editor -> New query -> paste -> Run (or `npx supabase db push` if you
-- use the CLI with a linked project).
--
-- Problem: consultations/messages RLS only admits the patient or the
-- assigned consultant, so pharmacy staff could never see the "Ask a
-- pharmacist" chats scoped to their pharmacy (pharmacy_id). This adds
-- member-read (and member-reply) policies keyed on is_pharmacy_member(),
-- reusing the helper from policies.sql (v2). Requires policies.sql to have
-- been run first.
--
-- Re-runnable: every policy is dropped first.
--
-- Verify afterwards (as a staff member's JWT, or just check existence):
--   select policyname from pg_policies
--    where schemaname = 'public' and tablename = 'consultations'
--      and policyname = 'consultations: member read';
--   select policyname from pg_policies
--    where schemaname = 'public' and tablename = 'consultation_messages'
--      and policyname in ('messages: member read', 'messages: member send');

-- ------------------------------------------------- consultations: member read
drop policy if exists "consultations: member read" on consultations;
create policy "consultations: member read" on consultations
  for select to authenticated
  using (pharmacy_id is not null and is_pharmacy_member(pharmacy_id));

-- ------------------------------------------- messages: member read and reply
drop policy if exists "messages: member read" on consultation_messages;
create policy "messages: member read" on consultation_messages
  for select to authenticated using (
    exists (
      select 1 from consultations c
      where c.id = consultation_id
        and c.pharmacy_id is not null
        and is_pharmacy_member(c.pharmacy_id)
    )
  );

drop policy if exists "messages: member send" on consultation_messages;
create policy "messages: member send" on consultation_messages
  for insert to authenticated with check (
    sender_id = auth.uid() and exists (
      select 1 from consultations c
      where c.id = consultation_id
        and c.pharmacy_id is not null
        and is_pharmacy_member(c.pharmacy_id)
    )
  );
