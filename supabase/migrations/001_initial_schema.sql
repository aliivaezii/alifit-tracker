-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  name text not null,
  dob date not null,
  gender text check (gender in ('male', 'female')) not null,
  weight_kg numeric(5,2) not null,
  height_cm numeric(5,1) not null,
  goal text check (goal in ('fat_loss', 'recomposition', 'muscle_gain')) not null,
  activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active')) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Weight logs
create table weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight_kg numeric(5,2) not null,
  created_at timestamptz default now() not null,
  unique(user_id, date)
);

-- Workout sessions
create table workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  day_number int check (day_number between 1 and 6) not null,
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Exercise logs
create table exercise_logs (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references workout_sessions(id) on delete cascade not null,
  exercise_name text not null,
  muscle_group text not null,
  set_number int not null,
  weight_kg numeric(6,2) not null default 0,
  reps int not null default 0,
  completed boolean default false,
  created_at timestamptz default now() not null
);

-- Foods library
create table foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  calories_per_100g numeric(7,2) not null,
  protein_per_100g numeric(6,2) not null default 0,
  carbs_per_100g numeric(6,2) not null default 0,
  fat_per_100g numeric(6,2) not null default 0,
  is_default boolean default false,
  created_at timestamptz default now() not null
);

-- Meal logs
create table meal_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  meal_type text check (meal_type in ('pre_workout','post_workout','breakfast','lunch','snack','dinner','evening')) not null,
  created_at timestamptz default now() not null
);

-- Meal items
create table meal_items (
  id uuid primary key default uuid_generate_v4(),
  meal_log_id uuid references meal_logs(id) on delete cascade not null,
  food_id uuid references foods(id) not null,
  quantity_g numeric(7,2) not null,
  calories numeric(7,2) not null,
  protein numeric(6,2) not null,
  carbs numeric(6,2) not null,
  fat numeric(6,2) not null,
  created_at timestamptz default now() not null
);

-- RLS Policies
alter table profiles enable row level security;
alter table weight_logs enable row level security;
alter table workout_sessions enable row level security;
alter table exercise_logs enable row level security;
alter table foods enable row level security;
alter table meal_logs enable row level security;
alter table meal_items enable row level security;

-- Profiles policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);

-- Weight logs policies
create policy "Users can manage own weight logs" on weight_logs for all using (auth.uid() = user_id);

-- Workout sessions policies
create policy "Users can manage own workout sessions" on workout_sessions for all using (auth.uid() = user_id);

-- Exercise logs: join through workout_sessions
create policy "Users can manage own exercise logs" on exercise_logs for all
  using (session_id in (select id from workout_sessions where user_id = auth.uid()));

-- Foods: users see default foods and their own
create policy "Users can view default and own foods" on foods for select
  using (is_default = true or auth.uid() = user_id);
create policy "Users can insert own foods" on foods for insert with check (auth.uid() = user_id);
create policy "Users can update own foods" on foods for update using (auth.uid() = user_id);
create policy "Users can delete own foods" on foods for delete using (auth.uid() = user_id);

-- Meal logs policies
create policy "Users can manage own meal logs" on meal_logs for all using (auth.uid() = user_id);

-- Meal items: join through meal_logs
create policy "Users can manage own meal items" on meal_items for all
  using (meal_log_id in (select id from meal_logs where user_id = auth.uid()));

-- Trigger to auto-update profiles.updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Indexes for performance
create index idx_weight_logs_user_date on weight_logs(user_id, date desc);
create index idx_workout_sessions_user_date on workout_sessions(user_id, date desc);
create index idx_exercise_logs_session on exercise_logs(session_id);
create index idx_meal_logs_user_date on meal_logs(user_id, date desc);
create index idx_meal_items_meal_log on meal_items(meal_log_id);
create index idx_foods_default on foods(is_default) where is_default = true;
