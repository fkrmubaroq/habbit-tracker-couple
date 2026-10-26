-- 001-pomodoro-schema.sql for PostgreSQL / Supabase
--
-- Ownership: @repo/pomodoro-tracker-api owns both tables. `users` is read-only.
-- `started_at` / `ended_at` are TIMESTAMPTZ so pg returns real instants
-- regardless of the database server's timezone.

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(80) NULL,
    planned_minutes INT NOT NULL,
    actual_minutes INT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Session ids are client-generated UUIDs, so uniqueness is scoped per user:
    -- two people must be able to own the same UUID without colliding.
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_started ON pomodoro_sessions(user_id, started_at);

CREATE TABLE IF NOT EXISTS pomodoro_settings (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    focus_minutes INT NOT NULL DEFAULT 25,
    short_break_minutes INT NOT NULL DEFAULT 5,
    long_break_minutes INT NOT NULL DEFAULT 15,
    long_break_interval INT NOT NULL DEFAULT 4,
    auto_start_break BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
