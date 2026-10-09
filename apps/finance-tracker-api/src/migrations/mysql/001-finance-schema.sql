-- 001-finance-schema.sql for MySQL

CREATE TABLE IF NOT EXISTS finance_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    initial_balance DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fin_settings_user (user_id, partner_id)
);

CREATE TABLE IF NOT EXISTS finance_categories (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    color VARCHAR(30) NOT NULL DEFAULT '#38B2AC',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fin_cat_user (user_id, partner_id, type)
);

CREATE TABLE IF NOT EXISTS finance_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    category_id VARCHAR(36) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fin_tx_date (user_id, partner_id, date),
    INDEX idx_fin_tx_cat (category_id),
    FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS finance_budgets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    category_id VARCHAR(36) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    period ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    month_year VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS finance_assets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Tabungan',
    amount DECIMAL(14, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance_liabilities (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    partner_id VARCHAR(36) NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Pinjaman',
    amount DECIMAL(14, 2) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
