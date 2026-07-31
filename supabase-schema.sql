-- Chạy đoạn này trong Supabase: Project > SQL Editor > New query > Run

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  maps_link text,
  status text not null check (status in ('visited', 'want_to_go', 'not_yet')),
  visited_date date,
  rating smallint check (rating between 1 and 5),
  notes text,
  photo_links text[] not null default '{}',
  added_by text,
  created_at timestamptz not null default now()
);

-- Bật Row Level Security
alter table places enable row level security;

-- Vì app này dùng chung link riêng tư giữa 2 người (không có đăng nhập),
-- ta cho phép đọc/ghi công khai qua anon key. Không chia sẻ URL app cho ai khác.
create policy "Public can read places"
  on places for select
  using (true);

create policy "Public can insert places"
  on places for insert
  with check (true);

create policy "Public can update places"
  on places for update
  using (true);

create policy "Public can delete places"
  on places for delete
  using (true);

-- =========================================================
-- Hồ sơ 2 người: tên, ảnh đại diện, ngày yêu nhau (đếm ngày)
-- =========================================================

create table if not exists couple_profile (
  id uuid primary key default gen_random_uuid(),
  partner1_name text not null default 'Bạn',
  partner1_avatar_url text,
  partner2_name text not null default 'Người yêu',
  partner2_avatar_url text,
  anniversary_date date,
  updated_at timestamptz not null default now()
);

alter table couple_profile enable row level security;

create policy "Public can read couple profile"
  on couple_profile for select
  using (true);

create policy "Public can insert couple profile"
  on couple_profile for insert
  with check (true);

create policy "Public can update couple profile"
  on couple_profile for update
  using (true);

-- Tạo sẵn 1 dòng hồ sơ mặc định để app luôn có dữ liệu để sửa
insert into couple_profile (partner1_name, partner2_name)
select 'Bạn', 'Người yêu'
where not exists (select 1 from couple_profile);

-- =========================================================
-- Storage bucket để upload ảnh đại diện thật (không cần dán link)
-- =========================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Public can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

create policy "Public can update avatars"
  on storage.objects for update
  using (bucket_id = 'avatars');

-- =========================================================
-- Ảnh mô tả quán: upload ảnh thật (thay vì dán link)
-- =========================================================

insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;

create policy "Public can view place photos"
  on storage.objects for select
  using (bucket_id = 'place-photos');

create policy "Public can upload place photos"
  on storage.objects for insert
  with check (bucket_id = 'place-photos');

create policy "Public can delete place photos"
  on storage.objects for delete
  using (bucket_id = 'place-photos');
