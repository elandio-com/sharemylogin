-- ShareMyLogin Database Schema (Public)
-- This shows what we store about your secrets.
-- Notice: NO PLAINTEXT anywhere.

CREATE TABLE secrets (
    id TEXT PRIMARY KEY,
    
    -- Encrypted data (we cannot decrypt this)
    ciphertext TEXT NOT NULL,     -- Your encrypted secret
    iv TEXT NOT NULL,             -- Initialization vector
    salt TEXT NOT NULL,           -- Key derivation salt
    
    -- Metadata only
    ttl_mode TEXT NOT NULL CHECK(ttl_mode IN ('one-time', '1h', '24h', '7d', '30d')),
    created_at INTEGER NOT NULL,  -- Unix timestamp
    expires_at INTEGER NOT NULL,  -- Unix timestamp
    viewed INTEGER DEFAULT 0 CHECK(viewed IN (0, 1)),
    
    -- Security
    destroy_token_hash TEXT       -- SHA-256 hash (not the actual token)
);

-- Indexes to improve query performance
CREATE INDEX idx_expires_at ON secrets(expires_at);
CREATE INDEX idx_created_at ON secrets(created_at);

-- Partial index for efficient cleanup of expired secrets
CREATE INDEX idx_cleanup ON secrets(expires_at) WHERE viewed = 0;

-- WHAT'S NOT HERE:
-- ❌ No plaintext passwords
-- ❌ No decryption keys
-- ❌ No way to read your data

-- We literally cannot decrypt your secrets.
-- Only someone with the original password can.
