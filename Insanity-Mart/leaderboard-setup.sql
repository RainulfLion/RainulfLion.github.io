-- Run in your Supabase SQL editor, then configure leaderboard-config.js.
create table public.insanity_scores (
  id uuid primary key,
  initials text not null check (initials ~ '^[A-Z]{1,3}$'),
  score integer not null check (score > 0 and score <= 1000000000),
  level integer not null check (level >= 1 and level <= 1000000),
  created_at timestamptz not null default now()
);
create index insanity_scores_ranking on public.insanity_scores (score desc, level desc, created_at asc);
alter table public.insanity_scores enable row level security;
grant select, insert on public.insanity_scores to anon;
create policy "Anyone can read rankings" on public.insanity_scores for select to anon using (true);
create policy "Anyone can submit a score" on public.insanity_scores for insert to anon with check (true);
-- Casual arcade rankings: scores are submitted by the browser and are not cheat-proof.
