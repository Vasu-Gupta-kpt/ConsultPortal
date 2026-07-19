-- Casebook-style content per case: a scripted interviewer<->candidate
-- transcript (`conversation`) and a "Structure/Framework" breakdown
-- (`case_facts`, `additional_info`, `framework_tree`, `recommendations`,
-- `tips`). Distinct from the existing student-submitted `case_comments`
-- ("Approaches") -- this is authored case content, not community discussion.
--
-- No RLS/grant changes needed: the existing SELECT-all and admin-only
-- INSERT policies on `cases` (see 20260716191756_admin_content.sql) are
-- row-level and already cover these new columns.
alter table public.cases
  add column case_facts text[] not null default '{}',
  add column additional_info text[] not null default '{}',
  add column conversation jsonb not null default '[]'::jsonb,
  add column framework_tree jsonb,
  add column recommendations text[] not null default '{}',
  add column tips text[] not null default '{}';
