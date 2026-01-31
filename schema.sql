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
    ttl_mode TEXT NOT NULL,       -- 'one-time', '24h', or '7d'
    created_at INTEGER NOT NULL,  -- Unix timestamp
    expires_at INTEGER NOT NULL,  -- Unix timestamp
    viewed INTEGER DEFAULT 0,     -- Has been accessed?
    
    -- Security
    destroy_token_hash TEXT       -- SHA-256 hash (not the actual token)
);

-- Indexes to improve query performance
CREATE INDEX idx_expires_at ON secrets(expires_at);
CREATE INDEX idx_created_at ON secrets(created_at);

-- WHAT'S NOT HERE:
-- ❌ No plaintext passwords
-- ❌ No decryption keys
-- ❌ No way to read your data

-- We literally cannot decrypt your secrets.
-- Only someone with the original password can.
