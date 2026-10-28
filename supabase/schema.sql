-- Run in Supabase SQL Editor. This schema starts private by default; public visitors only see published content.
create table if not exists public.work_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '',
  category text not null default 'Community',
  activity_date date,
  image_url text,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '',
  event_date timestamptz not null,
  location text not null default '',
  registration_url text,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.site_settings (
  key text primary key check (key in ('mission','instagram_url','contact_email','contact_phone','donation_qr_url','upi_id')),
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.work_posts enable row level security;
alter table public.events enable row level security;
alter table public.site_settings enable row level security;

-- Public read is limited to published work and events.
drop policy if exists "Public can read published work" on public.work_posts;
create policy "Public can read published work" on public.work_posts for select to anon, authenticated using (published = true);
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events" on public.events for select to anon, authenticated using (published = true);
-- Site settings are public because they render on the public site. Never store secrets here.
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);

-- Admin write policies rely on a private allowlist table, not browser-controlled metadata.
create table if not exists public.site_admins (user_id uuid primary key references auth.users(id) on delete cascade, email text not null unique, created_at timestamptz not null default now());
alter table public.site_admins enable row level security;
revoke all on public.site_admins from anon, authenticated;
-- Admins must be inserted by the project owner in SQL after their auth account exists.
-- Restrict write operations using site_admins membership.
drop policy if exists "Admins can manage work" on public.work_posts;
create policy "Admins can manage work" on public.work_posts for all to authenticated using (exists(select 1 from public.site_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events" on public.events for all to authenticated using (exists(select 1 from public.site_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins can manage settings" on public.site_settings;
create policy "Admins can manage settings" on public.site_settings for all to authenticated using (exists(select 1 from public.site_admins a where a.user_id = auth.uid())) with check (exists(select 1 from public.site_admins a where a.user_id = auth.uid()));

-- Storage bucket for approved public work photos and QR image. Create bucket in Storage UI as public
-- only if public image URLs are acceptable; uploads/writes should be restricted to site_admins.
insert into storage.buckets (id, name, public) values ('foundation-media','foundation-media',true) on conflict (id) do nothing;
drop policy if exists "Public can view foundation media" on storage.objects;
create policy "Public can view foundation media" on storage.objects for select to anon, authenticated using (bucket_id = 'foundation-media');
drop policy if exists "Admins can upload foundation media" on storage.objects;
create policy "Admins can upload foundation media" on storage.objects for insert to authenticated with check (bucket_id = 'foundation-media' and exists(select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins can update foundation media" on storage.objects;
create policy "Admins can update foundation media" on storage.objects for update to authenticated using (bucket_id = 'foundation-media' and exists(select 1 from public.site_admins a where a.user_id = auth.uid())) with check (bucket_id = 'foundation-media' and exists(select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins can delete foundation media" on storage.objects;
create policy "Admins can delete foundation media" on storage.objects for delete to authenticated using (bucket_id = 'foundation-media' and exists(select 1 from public.site_admins a where a.user_id = auth.uid()));
