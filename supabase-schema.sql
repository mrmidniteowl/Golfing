-- =============================================
-- Golfing with the Boyz Database Schema for Supabase
-- =============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'player' check (role in ('player', 'commissioner', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- =============================================
-- COURSES
-- =============================================
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  state text,
  par integer not null default 72,
  hole_pars integer[] not null default '{4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4}',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Courses are viewable by everyone"
  on public.courses for select
  using (true);

create policy "Authenticated users can add courses"
  on public.courses for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update courses"
  on public.courses for update
  using (auth.role() = 'authenticated');

-- =============================================
-- ROUNDS
-- =============================================
create table public.rounds (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  date date not null default current_date,
  total_score integer not null,
  total_putts integer,
  fairways_hit integer,
  greens_in_regulation integer,
  total_penalties integer not null default 0,
  notes text,
  is_locked boolean not null default false,
  play_mode text not null default 'non_league' check (play_mode in ('league', 'non_league')),
  league_id_night text,
  team_name text,
  nine_side text check (nine_side is null or nine_side in ('front', 'back')),
  hole_count integer not null default 18 check (hole_count in (9, 18)),
  created_at timestamptz not null default now(),
  constraint rounds_league_fields_check check (
    (play_mode = 'league'
      and league_id_night is not null
      and team_name is not null
      and hole_count = 9)
    or play_mode = 'non_league'
  ),
  constraint rounds_nine_side_required_check check (
    (hole_count = 9 and nine_side is not null)
    or (hole_count = 18 and nine_side is null)
  )
);

alter table public.rounds enable row level security;

create policy "Rounds are viewable by everyone"
  on public.rounds for select
  using (true);

create policy "Users can insert own rounds"
  on public.rounds for insert
  with check (auth.uid() = user_id);

create policy "Users can update own unlocked rounds"
  on public.rounds for update
  using (auth.uid() = user_id and is_locked = false);

create policy "Users can delete own unlocked rounds"
  on public.rounds for delete
  using (auth.uid() = user_id and is_locked = false);

-- Commissioners can update any round (for corrections/locking)
create policy "Commissioners can update any round"
  on public.rounds for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('commissioner', 'admin')
    )
  );

-- Commissioners can delete any round
create policy "Commissioners can delete any round"
  on public.rounds for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('commissioner', 'admin')
    )
  );

-- =============================================
-- HOLE SCORES
-- =============================================
create table public.hole_scores (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  hole_number integer not null check (hole_number between 1 and 18),
  strokes integer not null check (strokes > 0),
  putts integer check (putts >= 0),
  fairway_hit boolean,
  gir boolean,
  penalty_strokes integer not null default 0,
  unique (round_id, hole_number)
);

alter table public.hole_scores enable row level security;

create policy "Hole scores are viewable by everyone"
  on public.hole_scores for select
  using (true);

create policy "Users can insert hole scores for own rounds"
  on public.hole_scores for insert
  with check (
    exists (
      select 1 from public.rounds
      where id = round_id and user_id = auth.uid()
    )
  );

create policy "Users can update hole scores for own rounds"
  on public.hole_scores for update
  using (
    exists (
      select 1 from public.rounds
      where id = round_id and user_id = auth.uid() and is_locked = false
    )
  );

-- =============================================
-- LEAGUES
-- =============================================
create table public.leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  commissioner_id uuid references public.profiles(id) not null,
  season_start date not null,
  season_end date not null,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.leagues enable row level security;

create policy "Leagues are viewable by everyone"
  on public.leagues for select
  using (true);

create policy "Commissioners can create leagues"
  on public.leagues for insert
  with check (auth.uid() = commissioner_id);

create policy "Commissioners can update own leagues"
  on public.leagues for update
  using (auth.uid() = commissioner_id);

-- =============================================
-- LEAGUE MEMBERS
-- =============================================
create table public.league_members (
  league_id uuid references public.leagues(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

alter table public.league_members enable row level security;

create policy "League members are viewable by everyone"
  on public.league_members for select
  using (true);

create policy "Users can join leagues"
  on public.league_members for insert
  with check (auth.uid() = user_id);

-- =============================================
-- TEAMS
-- =============================================
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  league_id_night text not null default 'PGC.Thursday',
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;

create policy "Teams are viewable by everyone"
  on public.teams for select using (true);

create policy "Commissioners can manage teams"
  on public.teams for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('commissioner', 'admin')));

insert into public.teams (name, league_id_night) values ('Wisconsin Knights', 'PGC.Thursday'), ('Test', 'PGC.Thursday');

-- =============================================
-- INDEXES for performance
-- =============================================
create index idx_rounds_user_id on public.rounds(user_id);
create index idx_rounds_date on public.rounds(date desc);
create index idx_rounds_course_id on public.rounds(course_id);
create index idx_rounds_play_mode on public.rounds(play_mode);
create index idx_hole_scores_round_id on public.hole_scores(round_id);
create index idx_league_members_user_id on public.league_members(user_id);

-- =============================================
-- OPTIONAL: Create a trigger to auto-create profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'player'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- SEED: The Patriot Golf Club (default course)
-- =============================================
insert into public.courses (name, city, state, par, hole_pars, lat, lng)
values (
  'The Patriot Golf Club',
  'Abrams',
  'WI',
  72,
  '{4,3,4,4,4,4,3,5,4,4,4,3,4,5,5,4,4,4}',
  44.7833,
  -88.0667
);
