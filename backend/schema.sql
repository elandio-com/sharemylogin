-- ShareMyLogin D1 Schema
-- Zero-knowledge design: no plaintext secrets stored

-- Secrets table (encrypted blobs only)
CREATE TABLE IF NOT EXISTS secrets (
    id TEXT PRIMARY KEY,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    salt TEXT NOT NULL,
    ttl_mode TEXT NOT NULL CHECK(ttl_mode IN ('one-time', '24h', '7d')),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    viewed INTEGER DEFAULT 0,
    attempt_count INTEGER DEFAULT 0,
    destroy_token_hash TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets(expires_at);
CREATE INDEX IF NOT EXISTS idx_secrets_created_at ON secrets(created_at);

-- Rate limiting (IP hashed for privacy)
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    reset_at INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Daily aggregate stats (no PII)
CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT PRIMARY KEY,
    secrets_created INTEGER DEFAULT 0,
    secrets_viewed INTEGER DEFAULT 0,
    secrets_expired INTEGER DEFAULT 0,
    failed_decrypts INTEGER DEFAULT 0,
    rate_limited INTEGER DEFAULT 0
);

-- Security events for abuse detection (aggregated)
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    ip_hash TEXT,
    count INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
