create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Asia/Kolkata',
  check_in_time time not null,
  check_out_time time not null,
  cleaning_buffer_minutes integer not null,
  max_event_guests integer not null,
  max_overnight_guests integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_name_not_blank check (btrim(name) <> ''),
  constraint properties_slug_not_blank check (btrim(slug) <> ''),
  constraint properties_timezone_not_blank check (btrim(timezone) <> ''),
  constraint properties_cleaning_buffer_nonnegative check (cleaning_buffer_minutes >= 0),
  constraint properties_event_capacity check (max_event_guests between 1 and 30),
  constraint properties_overnight_capacity check (max_overnight_guests between 1 and 8)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text not null,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_not_blank check (btrim(name) <> ''),
  constraint customers_phone_not_blank check (btrim(phone) <> ''),
  constraint customers_email_not_blank check (email is null or btrim(email) <> ''),
  constraint customers_whatsapp_not_blank check (whatsapp is null or btrim(whatsapp) <> '')
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.admin_role not null default 'operations',
  name text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admins_name_not_blank check (btrim(name) <> ''),
  constraint admins_email_not_blank check (btrim(email) <> '')
);

comment on table public.properties is 'Safe operational configuration for a complete-property rental.';
comment on table public.customers is 'Private CRM records; never directly exposed to anonymous users.';
comment on table public.admins is 'Application administrator membership mapped to Supabase Auth users.';
