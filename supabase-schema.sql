-- Run this in your Supabase SQL editor (Database > SQL Editor > New Query)

-- Submissions table
create table submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  submitter_name text not null,
  relationship text,
  memory text not null,
  for_kids text not null default 'both', -- 'yes' | 'no' | 'both'
  video_link text,
  photo_paths text[] default '{}',
  video_uids text[] default '{}',
  prompt text,
  approved boolean not null default false
);

-- Site settings (hero photo, etc.)
create table site_settings (
  key text primary key,
  value text
);

-- Allow public read of settings
alter table site_settings enable row level security;
create policy "Public can read settings"
  on site_settings for select
  using (true);


alter table submissions enable row level security;

-- Allow anyone to INSERT (submit a memory)
create policy "Anyone can submit"
  on submissions for insert
  with check (true);

-- Only allow SELECT on approved submissions (for a future public gallery)
-- Unapproved submissions are only visible via the service role (admin)
create policy "Public can see approved"
  on submissions for select
  using (approved = true);

-- Storage bucket for photos
-- Go to Storage > New Bucket
-- Name: memories-photos
-- Public bucket: YES (so photos can be displayed without auth)
-- Run this after creating the bucket:

create policy "Anyone can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'memories-photos');

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'memories-photos');

-- If upgrading an existing install, run this to add site_settings:
-- create table if not exists site_settings (key text primary key, value text);
-- alter table site_settings enable row level security;
-- create policy "Public can read settings" on site_settings for select using (true);
