-- 002-pomodoro-session-pk.sql for MySQL
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
-- no migration ledger), so the ALTER is guarded and becomes a no-op once the
-- primary key already leads with `user_id`.

SET @pk_is_id_only := (
    SELECT COUNT(*)
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pomodoro_sessions'
       AND INDEX_NAME = 'PRIMARY'
       AND SEQ_IN_INDEX = 1
       AND COLUMN_NAME = 'id'
);

SET @pk_needs_rebuild := (
    SELECT COUNT(*)
      FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pomodoro_sessions'
       AND INDEX_NAME = 'PRIMARY'
       AND COLUMN_NAME = 'user_id'
);

SET @ddl := IF(
    @pk_is_id_only > 0 AND @pk_needs_rebuild = 0,
    'ALTER TABLE pomodoro_sessions DROP PRIMARY KEY, ADD PRIMARY KEY (user_id, id)',
    'DO 0'
);

PREPARE pomodoro_pk_stmt FROM @ddl;
EXECUTE pomodoro_pk_stmt;
DEALLOCATE PREPARE pomodoro_pk_stmt;
