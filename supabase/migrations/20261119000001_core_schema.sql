-- SWOJ — core schema
-- Users live in auth.users (Supabase Auth). Application data for every user is in public.profiles.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ── Enums ──────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('client', 'provider', 'admin');
create type public.provider_type as enum ('private', 'freelancer', 'sole_trader', 'company');
create type public.availability_status as enum ('today', 'tomorrow', 'this_week', 'busy');
create type public.provider_status as enum ('draft', 'published', 'suspended');
create type public.price_unit as enum ('usługa', 'godz.', 'm²', 'szt.');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.request_status as enum ('open', 'offers', 'assigned', 'closed');
create type public.offer_status as enum ('sent', 'accepted', 'rejected', 'withdrawn');
create type public.plan_id as enum ('free', 'pro', 'pro_plus');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

-- ── Helpers ────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Profiles (1:1 with auth.users) ────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text not null default '',
  email citext,
  phone text,
  avatar_url text,
  city_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row whenever someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Dictionaries ──────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  seo_plural text not null,
  person_noun text not null,
  icon text not null,
  description text not null,
  keywords text[] not null default '{}',
  faq jsonb not null default '[]',
  avg_price_from integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  locative text not null,
  voivodeship text not null default 'śląskie',
  lat double precision not null,
  lng double precision not null,
  postal_prefixes text[] not null default '{}',
  population integer,
  is_active boolean not null default true
);
create index locations_voivodeship_idx on public.locations (voivodeship);

-- ── Providers ─────────────────────────────────────────────────────────────────
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  gender text check (gender in ('f', 'm')),
  headline text not null default '',
  bio text not null default '',
  primary_category_id uuid not null references public.categories (id),
  location_id uuid not null references public.locations (id),
  district text,
  service_radius_km integer not null default 25 check (service_radius_km between 0 and 300),
  years_experience integer not null default 0,
  skills text[] not null default '{}',
  languages text[] not null default '{polski}',
  experience jsonb not null default '[]',
  certificates jsonb not null default '[]',
  provider_type public.provider_type not null default 'private',
  company_name text,
  nip text,
  verified boolean not null default false,
  -- Aggregates maintained by triggers / jobs, denormalised for fast listing.
  rating_avg numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  completed_jobs integer not null default 0,
  response_time_hours integer not null default 24,
  availability public.availability_status not null default 'this_week',
  plan public.plan_id not null default 'free',
  featured boolean not null default false,
  avatar_url text,
  avatar_hue smallint not null default 160,
  member_since smallint not null default extract(year from now()),
  status public.provider_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index providers_category_idx on public.providers (primary_category_id) where status = 'published';
create index providers_location_idx on public.providers (location_id) where status = 'published';
create index providers_rating_idx on public.providers (rating_avg desc, review_count desc);
create trigger providers_updated_at before update on public.providers
  for each row execute function public.set_updated_at();

-- Secondary categories
create table public.provider_categories (
  provider_id uuid not null references public.providers (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (provider_id, category_id)
);

-- Additional cities a provider explicitly serves (beyond the radius around the base city)
create table public.provider_locations (
  provider_id uuid not null references public.providers (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  primary key (provider_id, location_id)
);

-- ── Services ──────────────────────────────────────────────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  name text not null,
  description text not null default '',
  price_from integer not null check (price_from >= 0),
  price_unit public.price_unit not null default 'usługa',
  duration_min integer not null default 60,
  duration_max integer not null default 60,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (duration_max >= duration_min)
);
create index services_provider_idx on public.services (provider_id);
create index services_category_idx on public.services (category_id);

create table public.service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0)
);

-- ── Portfolio ────────────────────────────────────────────────────────────────
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  title text not null,
  description text not null default '',
  image_url text,
  hue smallint not null default 160,
  pattern text not null default 'grid',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index portfolio_provider_idx on public.portfolio_items (provider_id);

-- ── Availability (weekly schedule) ───────────────────────────────────────────
create table public.availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Monday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time),
  unique (provider_id, weekday)
);

-- ── Bookings ─────────────────────────────────────────────────────────────────
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete restrict,
  client_id uuid references public.profiles (id) on delete set null,
  service_id uuid not null references public.services (id) on delete restrict,
  scheduled_date date not null,
  scheduled_time time not null,
  street text not null,
  postal_code text not null,
  city text not null,
  contact_name text not null,
  contact_phone text not null,
  notes text,
  status public.booking_status not null default 'pending',
  total integer not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_provider_date_idx on public.bookings (provider_id, scheduled_date);
create index bookings_client_idx on public.bookings (client_id);
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  service_option_id uuid references public.service_options (id) on delete set null,
  label text not null,
  price integer not null check (price >= 0)
);

-- ── Reviews ──────────────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  booking_id uuid unique references public.bookings (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  author_city text,
  service_name text,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 3 and 2000),
  verified_booking boolean not null default false,
  reply text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_provider_idx on public.reviews (provider_id, created_at desc);

-- ── Requests (custom jobs) & offers ──────────────────────────────────────────
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles (id) on delete set null,
  category_id uuid not null references public.categories (id),
  location_id uuid not null references public.locations (id),
  title text not null,
  description text not null,
  photos text[] not null default '{}',
  preferred_date text,
  budget integer check (budget >= 0),
  contact_email citext not null,
  status public.request_status not null default 'open',
  created_at timestamptz not null default now()
);
create index requests_match_idx on public.requests (category_id, location_id) where status in ('open', 'offers');

create table public.request_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  price integer check (price >= 0),
  message text not null,
  status public.offer_status not null default 'sent',
  created_at timestamptz not null default now(),
  unique (request_id, provider_id)
);

-- ── Engagement ───────────────────────────────────────────────────────────────
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, provider_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  request_id uuid references public.requests (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages (recipient_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ── Monetisation ─────────────────────────────────────────────────────────────
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  plan public.plan_id not null,
  status text not null default 'active',
  external_id text unique, -- Stripe subscription id
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider text not null default 'stripe',
  external_id text unique,
  amount integer not null,
  currency text not null default 'PLN',
  kind text not null check (kind in ('booking_fee', 'commission', 'lead_fee', 'subscription', 'featured')),
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ── Trust & safety ───────────────────────────────────────────────────────────
create table public.verification (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  type text not null check (type in ('identity', 'business', 'certificate', 'phone')),
  status public.verification_status not null default 'pending',
  document_path text, -- storage path in a private bucket, never public
  notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('provider', 'review', 'request', 'message')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- ── Rating aggregate trigger ─────────────────────────────────────────────────
create or replace function public.refresh_provider_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.provider_id, old.provider_id);
begin
  update public.providers p set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where provider_id = pid and not is_hidden), 0),
    review_count = (select count(*) from public.reviews where provider_id = pid and not is_hidden)
  where p.id = pid;
  return null;
end;
$$;
create trigger reviews_refresh_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_provider_rating();

-- ── Search view ──────────────────────────────────────────────────────────────
create or replace view public.provider_search with (security_invoker = true) as
select
  p.*,
  c.slug as category_slug,
  l.slug as city_slug,
  coalesce(
    (select array_agg(c2.slug) from public.provider_categories pc join public.categories c2 on c2.id = pc.category_id where pc.provider_id = p.id),
    '{}'
  ) as secondary_category_slugs
from public.providers p
join public.categories c on c.id = p.primary_category_id
join public.locations l on l.id = p.location_id
where p.status = 'published';
