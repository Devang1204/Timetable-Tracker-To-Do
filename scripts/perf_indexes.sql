-- Performance indexes to speed up timetable, todo, and availability queries.
-- Run once: psql "$DATABASE_URL" -f scripts/perf_indexes.sql
-- Safe to re-run (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_timetables_user_start
  ON timetables (user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_todos_user_due
  ON todos (user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_availability_user_day_start
  ON availability (user_id, day_of_week, start_time);