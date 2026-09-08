-- 002-grocery-schema.sql for PostgreSQL / Supabase

CREATE TABLE IF NOT EXISTS grocery_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
    quantity VARCHAR(50) NOT NULL DEFAULT '1',
    unit VARCHAR(50) NULL,
    estimated_price NUMERIC(12, 2) NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grocery_user_partner ON grocery_items(user_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_grocery_completed ON grocery_items(is_completed);
