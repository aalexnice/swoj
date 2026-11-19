-- SWOJ — Row Level Security
-- Principle: public catalogue data is readable by everyone; personal data only by its owner;
-- admins can read and moderate everything. Writes from server routes that need to bypass RLS
-- use the service-role key, which is never exposed to the browser.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_provider_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.providers where user_id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.providers enable row level security;
alter table public.provider_categories enable row level security;
alter table public.provider_locations enable row level security;
alter table public.services enable row level security;
alter table public.service_options enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_items enable row level security;
alter table public.reviews enable row level security;
alter table public.requests enable row level security;
alter table public.request_offers enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.verification enable row level security;
alter table public.reports enable row level security;

-- Profiles: owner reads/updates own row (role changes are admin-only via a column check).
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin());

-- Dictionaries: public read, admin write.
create policy "categories_read" on public.categories for select using (true);
create policy "categories_admin" on public.categories for all using (public.is_admin());
create policy "locations_read" on public.locations for select using (true);
create policy "locations_admin" on public.locations for all using (public.is_admin());

-- Providers: published profiles are public; owners manage their own; admins everything.
-- verified / plan / featured / aggregates are protected by the trigger below.
create policy "providers_read_published" on public.providers for select
  using (status = 'published' or user_id = auth.uid() or public.is_admin());
create policy "providers_insert_own" on public.providers for insert with check (user_id = auth.uid());
create policy "providers_update_own" on public.providers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "providers_admin" on public.providers for all using (public.is_admin());

create or replace function public.protect_provider_columns() returns trigger
language plpgsql as $$
begin
  -- Only end users (anon/authenticated) are restricted; service role, admins and migrations/seeds are not.
  if not public.is_admin() and coalesce(auth.role(), 'postgres') in ('anon', 'authenticated') then
    new.verified := old.verified;
    new.plan := old.plan;
    new.featured := old.featured;
    new.rating_avg := old.rating_avg;
    new.review_count := old.review_count;
    new.completed_jobs := old.completed_jobs;
  end if;
  return new;
end;
$$;
create trigger providers_protect_columns before update on public.providers
  for each row execute function public.protect_provider_columns();

-- Child tables of a provider: public read when the provider is published, owner write.
create policy "provider_categories_read" on public.provider_categories for select using (true);
create policy "provider_categories_own" on public.provider_categories for all
  using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());
create policy "provider_locations_read" on public.provider_locations for select using (true);
create policy "provider_locations_own" on public.provider_locations for all
  using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());
create policy "services_read" on public.services for select using (is_active or provider_id = public.my_provider_id());
create policy "services_own" on public.services for all
  using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());
create policy "service_options_read" on public.service_options for select using (true);
create policy "service_options_own" on public.service_options for all
  using (exists (select 1 from public.services s where s.id = service_id and s.provider_id = public.my_provider_id()));
create policy "portfolio_read" on public.portfolio_items for select using (true);
create policy "portfolio_own" on public.portfolio_items for all
  using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());
create policy "availability_read" on public.availability for select using (true);
create policy "availability_own" on public.availability for all
  using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());

-- Bookings: visible to the client and the provider; anyone signed in can create one for themselves.
create policy "bookings_read_parties" on public.bookings for select
  using (client_id = auth.uid() or provider_id = public.my_provider_id() or public.is_admin());
create policy "bookings_insert_client" on public.bookings for insert with check (client_id = auth.uid());
create policy "bookings_update_parties" on public.bookings for update
  using (client_id = auth.uid() or provider_id = public.my_provider_id() or public.is_admin());
create policy "booking_items_read" on public.booking_items for select
  using (exists (select 1 from public.bookings b where b.id = booking_id
    and (b.client_id = auth.uid() or b.provider_id = public.my_provider_id() or public.is_admin())));
create policy "booking_items_insert" on public.booking_items for insert
  with check (exists (select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid()));

-- Reviews: public read (unless hidden); only the client of a completed booking may write one.
create policy "reviews_read" on public.reviews for select using (not is_hidden or public.is_admin());
create policy "reviews_insert_verified" on public.reviews for insert with check (
  author_id = auth.uid()
  and exists (select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid() and b.status = 'completed')
);
create policy "reviews_reply_provider" on public.reviews for update using (provider_id = public.my_provider_id());
create policy "reviews_admin" on public.reviews for all using (public.is_admin());

-- Requests: owner sees own; providers see open requests in their categories; admins all.
create policy "requests_read" on public.requests for select using (
  client_id = auth.uid()
  or public.is_admin()
  or (status in ('open', 'offers') and exists (
    select 1 from public.providers p
    where p.id = public.my_provider_id()
      and (p.primary_category_id = category_id
        or exists (select 1 from public.provider_categories pc where pc.provider_id = p.id and pc.category_id = requests.category_id))
  ))
);
create policy "requests_insert" on public.requests for insert with check (client_id = auth.uid());
create policy "requests_update_own" on public.requests for update using (client_id = auth.uid() or public.is_admin());

create policy "offers_read" on public.request_offers for select using (
  provider_id = public.my_provider_id()
  or exists (select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid())
  or public.is_admin()
);
create policy "offers_insert_provider" on public.request_offers for insert with check (provider_id = public.my_provider_id());
create policy "offers_update" on public.request_offers for update using (
  provider_id = public.my_provider_id()
  or exists (select 1 from public.requests r where r.id = request_id and r.client_id = auth.uid())
);

-- Personal data.
create policy "favorites_own" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages_parties" on public.messages for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "messages_send" on public.messages for insert with check (sender_id = auth.uid());
create policy "messages_mark_read" on public.messages for update using (recipient_id = auth.uid());
create policy "notifications_own" on public.notifications for all using (user_id = auth.uid());

-- Money & verification: readable by the owning provider, written only by the server (service role).
create policy "subscriptions_read_own" on public.subscriptions for select using (provider_id = public.my_provider_id() or public.is_admin());
create policy "payments_admin" on public.payments for select using (public.is_admin());
create policy "verification_read_own" on public.verification for select using (provider_id = public.my_provider_id() or public.is_admin());
create policy "verification_submit" on public.verification for insert with check (provider_id = public.my_provider_id());
create policy "verification_admin" on public.verification for update using (public.is_admin());
create policy "reports_insert" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports_admin" on public.reports for all using (public.is_admin());
