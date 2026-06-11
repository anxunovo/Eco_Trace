CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT '',
    school TEXT NOT NULL DEFAULT '',
    campus TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
    eco_points INTEGER NOT NULL DEFAULT 0,
    contact_method TEXT NOT NULL DEFAULT 'wechat',
    contact_value TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    trade_mode TEXT NOT NULL DEFAULT 'FREE' CHECK (trade_mode IN ('SALE', 'FREE', 'SWAP', 'NEGOTIABLE')),
    price REAL,
    swap_wanted TEXT,
    condition TEXT NOT NULL DEFAULT 'GOOD' CHECK (condition IN ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'UNKNOWN')),
    campus TEXT NOT NULL DEFAULT '',
    location_text TEXT NOT NULL DEFAULT '',
    contact_method TEXT NOT NULL DEFAULT 'wechat',
    contact_value TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    estimated_weight_kg REAL,
    estimated_carbon_saved_kg REAL NOT NULL DEFAULT 0,
    ai_confidence REAL,
    ai_assumptions TEXT NOT NULL DEFAULT '[]',
    is_food INTEGER NOT NULL DEFAULT 0,
    food_info TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    interested_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'REMOVED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_listings_status_category ON listings(status, category);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);

CREATE TABLE IF NOT EXISTS interests (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_interests_listing ON interests(listing_id);

CREATE TABLE IF NOT EXISTS carbon_records (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL REFERENCES listings(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    carbon_saved_kg REAL NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'LISTING_COMPLETED',
    is_food INTEGER NOT NULL DEFAULT 0,
    weight_kg REAL NOT NULL DEFAULT 0,
    engine_version TEXT NOT NULL DEFAULT 'v1',
    coefficient_source TEXT NOT NULL DEFAULT 'CLCD',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_carbon_records_user ON carbon_records(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_records_category ON carbon_records(category);
CREATE INDEX IF NOT EXISTS idx_carbon_records_created ON carbon_records(created_at DESC);

CREATE TABLE IF NOT EXISTS carbon_coefficients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    subcategory TEXT,
    mode TEXT NOT NULL DEFAULT 'per_kg' CHECK (mode IN ('per_kg', 'per_item')),
    factor REAL NOT NULL,
    substitution_rate REAL NOT NULL DEFAULT 1.0,
    default_weight_kg REAL,
    source TEXT NOT NULL DEFAULT 'CLCD' CHECK (source IN ('CLCD', 'ecoinvent', 'IPCC', 'custom')),
    source_ref TEXT,
    source_version TEXT,
    effective_from TEXT NOT NULL DEFAULT (datetime('now')),
    effective_to TEXT,
    note TEXT NOT NULL DEFAULT '',
    UNIQUE(category, subcategory, source, effective_from)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_coefficients_active ON carbon_coefficients(category, subcategory, effective_to);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    badge_key TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, badge_key)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
