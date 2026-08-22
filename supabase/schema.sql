-- Execute uma vez no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.media_type as enum ('video', 'audio');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.categories (
  id text primary key,
  name text not null,
  slug text not null unique
);

create table public.content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category_id text references public.categories(id) on delete set null,
  thumbnail text not null,
  video_url text not null default '',
  audio_url text not null default '',
  media_type public.media_type not null default 'video',
  tags text not null default '',
  views bigint not null default 0,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_url_present check (video_url <> '' or audio_url <> '')
);

create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  content_id uuid references public.content(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

create table public.history (
  user_id uuid references public.profiles(id) on delete cascade,
  content_id uuid references public.content(id) on delete cascade,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

insert into public.categories (id, name, slug) values
  ('biblia-cnbb', 'Bíblia CNBB', 'biblia-cnbb'),
  ('a-jornada', 'FIAT A Jornada', 'a-jornada'),
  ('eclesia', 'FIAT Eclésia', 'eclesia'),
  ('hesed', 'FIAT Hesed', 'hesed'),
  ('young', 'FIAT Young', 'young'),
  ('podcast', 'FIAT Podcast', 'podcast')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Membro FIAT'), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.content enable row level security;
alter table public.favorites enable row level security;
alter table public.history enable row level security;

create policy "profile owner or admin reads" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile owner inserts" on public.profiles for insert with check (id = auth.uid() and role = 'user');
create policy "admin updates profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create policy "categories are public" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "active content is public" on public.content for select using (is_active or public.is_admin());
create policy "admins create content" on public.content for insert with check (public.is_admin());
create policy "admins update content" on public.content for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete content" on public.content for delete using (public.is_admin());

create policy "members read own favorites" on public.favorites for select using (user_id = auth.uid());
create policy "members add own favorites" on public.favorites for insert with check (user_id = auth.uid());
create policy "members delete own favorites" on public.favorites for delete using (user_id = auth.uid());

create policy "members read own history" on public.history for select using (user_id = auth.uid());
create policy "members add own history" on public.history for insert with check (user_id = auth.uid());
create policy "members update own history" on public.history for update using (user_id = auth.uid()) with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.content to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update on public.history to authenticated;
grant insert, update, delete on public.content, public.categories to authenticated;

-- Depois que a primeira conta for cadastrada, promova-a pelo SQL Editor:
-- update public.profiles set role = 'admin' where email = 'seu@email.com';
