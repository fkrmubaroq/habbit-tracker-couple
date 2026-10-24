-- 002-grocery-schema.sql for MySQL

CREATE TABLE IF NOT EXISTS grocery_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
    quantity VARCHAR(50) NOT NULL DEFAULT '1',
    unit VARCHAR(50) NULL,
    estimated_price DECIMAL(12, 2) NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by VARCHAR(36) NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_grocery_user_partner (user_id, partner_id),
    INDEX idx_grocery_completed (is_completed),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);
