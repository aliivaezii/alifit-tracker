-- v1.2 improvements: indexes, goal_weight_kg column, is_deload column

-- Bug 2: goal_weight_kg on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_weight_kg NUMERIC(5,1) DEFAULT 80.0;

UPDATE profiles SET goal_weight_kg = 80.0 WHERE goal_weight_kg IS NULL;

-- Bug 4: is_deload flag on workout_sessions
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS is_deload BOOLEAN DEFAULT FALSE;

-- Bug 6: composite indexes for RLS and common query patterns
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id
  ON workout_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id
  ON exercise_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_exercise
  ON exercise_logs(session_id, exercise_name);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date
  ON meal_logs(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_log_id
  ON meal_items(meal_log_id);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
  ON weight_logs(user_id, date DESC);
