-- Profiles table — one row per auth user
create table if not exists public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  email            text not null,
  full_name        text,
  avatar_url       text,
  is_plus          boolean not null default false,
  searches_today   int not null default 0,
  last_search_date date,
  paystack_reference text,
  created_at       timestamptz not null default now()
);

-- RLS: users can only touch their own row
alter table public.profiles enable row level security;

create policy "select own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
