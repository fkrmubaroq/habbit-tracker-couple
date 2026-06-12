-- 001-initial-schema.sql for Supabase / PostgreSQL

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        CREATE TYPE role_type AS ENUM ('husband', 'wife');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_type') THEN
        CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'monthly');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_type') THEN
        CREATE TYPE badge_type AS ENUM ('personal', 'couple');
    END IF;
END$$;

-- Create tables
CREATE TABLE IF NOT EXISTS USERS (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_emoji VARCHAR(50) NOT NULL,
    avatar_image TEXT NULL,
    role role_type NOT NULL,
    partner_id UUID NULL,
    theme_preferences JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES USERS(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS HABITS (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon_emoji VARCHAR(50) NOT NULL,
    frequency frequency_type NOT NULL,
    is_shared BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS HABIT_LOGS (
    id UUID PRIMARY KEY,
    habit_id UUID NOT NULL,
    user_id UUID NOT NULL,
    completed_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT TRUE,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_habit_user_date UNIQUE (habit_id, user_id, completed_date),
    CONSTRAINT fk_habit FOREIGN KEY (habit_id) REFERENCES HABITS(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS STREAKS (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    habit_id UUID NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_completed_date DATE NULL,
    CONSTRAINT uq_user_habit UNIQUE (user_id, habit_id),
    CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    CONSTRAINT fk_streak_habit FOREIGN KEY (habit_id) REFERENCES HABITS(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BADGES (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    type badge_type NOT NULL,
    requirement_value INT NOT NULL
);

CREATE TABLE IF NOT EXISTS USER_BADGES (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    badge_id UUID NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id),
    CONSTRAINT fk_ub_user FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    CONSTRAINT fk_ub_badge FOREIGN KEY (badge_id) REFERENCES BADGES(id) ON DELETE CASCADE
);
