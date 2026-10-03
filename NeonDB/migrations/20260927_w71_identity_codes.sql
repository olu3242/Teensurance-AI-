-- Teensurance MVP identity, household, invitation and referral foundation.
-- Apply only to a dedicated Teensurance Supabase project.

create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('guardian','teen')),
  status text not null default 'active' check (status in ('active','removed')),
  joined_at timestamptz not null default now(),
  primary key (household_id,user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique check (code ~ '^INV-[A-HJ-NP-Z2-9]{8}$'),
  intended_role text not null check (intended_role in ('guardian','teen')),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses between 1 and 20),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^REF-[A-HJ-NP-Z2-9]{8}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id),
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  attributed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invitations enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_attributions enable row level security;

grant select,insert,update on public.profiles to authenticated;
grant select,insert,update on public.households to authenticated;
grant select,insert,update on public.household_members to authenticated;
grant select,insert,update on public.invitations to authenticated;
grant select,insert,update on public.referral_codes to authenticated;
grant select,insert on public.referral_attributions to authenticated;

create policy profiles_self_select on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy profiles_self_insert on public.profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_self_update on public.profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create policy households_member_select on public.households for select to authenticated using (
 exists(select 1 from public.household_members m where m.household_id=id and m.user_id=(select auth.uid()) and m.status='active')
);
create policy households_creator_insert on public.households for insert to authenticated with check (created_by=(select auth.uid()));

create policy members_same_household_select on public.household_members for select to authenticated using (
 exists(select 1 from public.household_members self where self.household_id=household_members.household_id and self.user_id=(select auth.uid()) and self.status='active')
);
create policy members_self_insert on public.household_members for insert to authenticated with check (user_id=(select auth.uid()));

create policy invitations_guardian_select on public.invitations for select to authenticated using (
 exists(select 1 from public.household_members m where m.household_id=invitations.household_id and m.user_id=(select auth.uid()) and m.role='guardian' and m.status='active')
);
create policy invitations_guardian_insert on public.invitations for insert to authenticated with check (
 created_by=(select auth.uid()) and exists(select 1 from public.household_members m where m.household_id=invitations.household_id and m.user_id=(select auth.uid()) and m.role='guardian' and m.status='active')
);
create policy invitations_guardian_update on public.invitations for update to authenticated using (
 exists(select 1 from public.household_members m where m.household_id=invitations.household_id and m.user_id=(select auth.uid()) and m.role='guardian' and m.status='active')
) with check (
 exists(select 1 from public.household_members m where m.household_id=invitations.household_id and m.user_id=(select auth.uid()) and m.role='guardian' and m.status='active')
);

create policy referral_owner_select on public.referral_codes for select to authenticated using (owner_user_id=(select auth.uid()));
create policy referral_owner_insert on public.referral_codes for insert to authenticated with check (owner_user_id=(select auth.uid()));
create policy attribution_referred_select on public.referral_attributions for select to authenticated using (referred_user_id=(select auth.uid()));

-- Code redemption requires an atomic server/RPC path because an invitee must not
-- receive broad SELECT permission over invitation rows. Implement redemption in
-- a reviewed private-schema function or trusted server endpoint before production.
