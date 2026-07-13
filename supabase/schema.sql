create table if not exists public.buddy_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pet jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.buddy_saves enable row level security;

drop policy if exists "Users can read their own Buddy" on public.buddy_saves;
create policy "Users can read their own Buddy"
  on public.buddy_saves for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own Buddy" on public.buddy_saves;
create policy "Users can create their own Buddy"
  on public.buddy_saves for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own Buddy" on public.buddy_saves;
create policy "Users can update their own Buddy"
  on public.buddy_saves for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
