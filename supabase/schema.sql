-- GreatestMe database. Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- Every journal record (profile, journeys, days, weeks, handwriting pages) is one row, owned by one user.
create table if not exists public.docs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null check (char_length(key) between 1 and 200),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists docs_user_updated on public.docs (user_id, updated_at);

alter table public.docs enable row level security;
drop policy if exists "docs: own rows only" on public.docs;
create policy "docs: own rows only" on public.docs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs for each row execute function public.touch_updated_at();

-- Partner (opt-in accountability). A user shares one summary row; only linked partners can read it.
create table if not exists public.partner_links (
  user_id    uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id),
  check (user_id <> partner_id)
);
alter table public.partner_links enable row level security;
drop policy if exists "links: see my links" on public.partner_links;
create policy "links: see my links" on public.partner_links for select to authenticated using (user_id = auth.uid());

create table if not exists public.shares (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  summary    jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.shares enable row level security;
drop policy if exists "shares: write my own" on public.shares;
create policy "shares: write my own" on public.shares for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "shares: partners can read" on public.shares;
create policy "shares: partners can read" on public.shares for select to authenticated
  using (exists (select 1 from public.partner_links l where l.user_id = auth.uid() and l.partner_id = shares.user_id));
drop trigger if exists shares_touch on public.shares;
create trigger shares_touch before insert or update on public.shares for each row execute function public.touch_updated_at();

-- Invite codes: one person makes a code, the other enters it, and both become partners.
create table if not exists public.invites (
  code       text primary key,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.invites enable row level security;
drop policy if exists "invites: manage my own" on public.invites;
create policy "invites: manage my own" on public.invites for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.accept_invite(invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select owner_id into owner from public.invites
   where code = upper(trim(invite_code)) and created_at > now() - interval '7 days';
  if owner is null then raise exception 'That invite code is not valid or has expired.'; end if;
  if owner = auth.uid() then raise exception 'That is your own invite code. Send it to your partner.'; end if;
  insert into public.partner_links (user_id, partner_id) values (auth.uid(), owner), (owner, auth.uid()) on conflict do nothing;
  delete from public.invites where code = upper(trim(invite_code));
  return owner;
end $$;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

create or replace function public.unlink_partner(other uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.partner_links where (user_id = auth.uid() and partner_id = other) or (user_id = other and partner_id = auth.uid());
end $$;
revoke all on function public.unlink_partner(uuid) from public;
grant execute on function public.unlink_partner(uuid) to authenticated;

-- Live updates across devices.
do $$ begin
  begin alter publication supabase_realtime add table public.docs; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.shares; exception when duplicate_object then null; end;
end $$;

-- Newer Supabase projects don't expose new tables automatically. Signed-in users get exactly
-- these table permissions; the row-level policies above still decide which rows they can touch.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.docs    to authenticated;
grant select, insert, update, delete on public.shares  to authenticated;
grant select                         on public.partner_links to authenticated;
grant select, insert, delete         on public.invites to authenticated;

-- Email recaps: a log so each recap is sent once. Only the server job (secret key) touches it.
create table if not exists public.email_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind    text not null,
  ref     text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.email_log enable row level security;
