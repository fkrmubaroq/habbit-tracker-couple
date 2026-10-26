-- 001-pomodoro-schema.sql for MySQL
--
-- Ownership: @repo/pomodoro-tracker-api owns both tables. `users` is read-only.
-- Timestamps are stored as naive UTC DATETIME (see config/database.ts, which
-- disables mysql2's date parsing so they are read back verbatim).

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    label VARCHAR(80) NULL,
    planned_minutes INT NOT NULL,
    actual_minutes INT NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME NOT NULL,
    -- DATETIME, not TIMESTAMP: TIMESTAMP is converted to the connection's
    -- session timezone on read, which would silently shift every instant.
    -- The API writes UTC explicitly instead.
    created_at DATETIME NOT NULL,
    -- Session ids are client-generated UUIDs, so uniqueness is scoped per user:
    -- two people must be able to own the same UUID without colliding. A global
    -- primary key on `id` alone would turn that case into a 500.
    PRIMARY KEY (user_id, id),
    INDEX idx_pomodoro_sessions_user_started (user_id, started_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pomodoro_settings (
    user_id VARCHAR(36) PRIMARY KEY,
    focus_minutes INT NOT NULL DEFAULT 25,
    short_break_minutes INT NOT NULL DEFAULT 5,
    long_break_minutes INT NOT NULL DEFAULT 15,
    long_break_interval INT NOT NULL DEFAULT 4,
    auto_start_break BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
