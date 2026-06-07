-- Lock down profiles before launch.
-- Browser may READ its own row (to show the search pill), but may NEVER write.
-- All writes (search counts, plus status) happen server-side with the
-- service-role key, which bypasses RLS. This closes the "user edits their own
-- is_plus / searches_today" hole.

-- 1. Make sure RLS is actually enforced.
alter table public.profiles enable row level security;

-- 2. Remove every write policy. Users get NO insert/update/delete from the client.
drop policy if exists "update own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "delete own profile" on public.profiles;

-- 3. Keep (recreate idempotently) read-own-row only.
drop policy if exists "select own profile" on public.profiles;
create policy "select own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Note: the on_auth_user_created trigger is SECURITY DEFINER, so new-profile
-- creation on signup still works with RLS enabled and no insert policy.
