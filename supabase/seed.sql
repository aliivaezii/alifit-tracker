-- Seed default foods library (user_id = null means globally available)
insert into foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, is_default) values
  ('Whey Protein ON (per scoop ~30g)', 400, 83.3, 10.0, 5.0, true),
  ('Creatine ON (5g serving)', 0, 0, 0, 0, true),
  ('Pascoli Italiani Protein Milk', 42, 5.0, 4.0, 0, true),
  ('Chicken Breast', 165, 31.0, 0, 3.6, true),
  ('Tuna canned in water', 116, 26.0, 0, 1.0, true),
  ('White Rice cooked', 130, 2.7, 28.0, 0.3, true),
  ('ES Sport High Protein Bar (per 100g)', 308, 30.8, 30.8, 7.7, true),
  ('Ground Meat lean 10% fat', 176, 21.0, 0, 10.0, true),
  ('Potato boiled', 87, 1.9, 20.0, 0.1, true),
  ('Pane Integrale whole wheat bread', 250, 10.0, 45.0, 3.75, true),
  ('Egg whole (per 100g)', 144, 12.0, 0.8, 10.0, true),
  ('Strawberries', 32, 0.7, 7.7, 0.3, true),
  ('Banana (per 100g)', 89, 1.1, 22.5, 0.3, true),
  ('Yogurt fat-free', 56, 10.0, 3.8, 0.4, true),
  ('Fiocchi d''Avena / Oat Flakes', 379, 13.0, 66.0, 7.0, true),
  ('Coffee black', 2, 0.3, 0, 0, true);

-- Note: Whey macros are per 100g equivalent of the powder for easy calculation.
-- The app will handle "1 scoop = 30g" via portion sizing.
