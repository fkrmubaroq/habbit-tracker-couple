-- 002-pomodoro-session-pk.sql for PostgreSQL / Supabase
--
-- Widens the uniqueness of `pomodoro_sessions` from "id is globally unique" to
-- "id is unique per user".
--
-- Why: the client generates the session UUID, and `insertSession` treats a
-- repeat of the same (id, user_id) as an idempotent retry. With a single-column
-- primary key on `id`, a different user submitting an id that already exists
-- found no row for itself, proceeded to INSERT, and failed with a duplicate-key
-- 500 — losing their session.
--
-- 001 already declares the composite key for fresh databases. This file exists
-- for databases created before that change.
--
-- Idempotent: `migrate.ts` re-runs every .sql file on each invocation (there is
-- no migration ledger), so the constraint swap only runs while the primary key
-- does not yet cover `user_id`.

DO $$
DECLARE
    pk_covers_user boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
          FROM pg_index i
          JOIN pg_attribute a
            ON a.attrelid = i.indrelid
           AND a.attnum = ANY (i.indkey)
         WHERE i.indrelid = 'pomodoro_sessions'::regclass
           AND i.indisprimary
           AND a.attname = 'user_id'
    ) INTO pk_covers_user;

    IF NOT pk_covers_user THEN
        ALTER TABLE pomodoro_sessions DROP CONSTRAINT IF EXISTS pomodoro_sessions_pkey;
        ALTER TABLE pomodoro_sessions ADD PRIMARY KEY (user_id, id);
    END IF;
END $$;
