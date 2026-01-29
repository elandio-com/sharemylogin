# ShareMyLogin API — Security Overview

What our API endpoints do, proving we **never access your plaintext data**.

---

## Endpoints

### `POST /api/create`

**What it receives:**
```json
{
  "ciphertext": "base64-encoded-encrypted-blob",
  "iv": "base64-initialization-vector",
  "salt": "base64-salt-for-key-derivation",
  "expiryType": "one-time | 24h | 7d",
  "turnstileToken": "captcha-token"
}
```

**What it returns:**
- `id`: The public identifier for the secret.
- `destroyToken`: A token required to delete the secret (or view it if one-time). **This is never stored by us in plaintext.**

---

### `GET /api/view/:id`

**What it returns:**
- **Metadata only** (e.g., `expiresAt`, `ttlMode`).
- **NO ciphertext.** This prevents "drive-by" downloads of encrypted data.

---

### `POST /api/attempt/:id`

**What it does:**
- Verifies CAPTCHA.
- Checks rate limits (prevent brute-forcing).
- Returns `remainingAttempts`.

---

### `POST /api/reveal/:id`

**What it returns:**
- The `ciphertext`, `iv`, and `salt`.
- **Requires** `X-Destroy-Token` header if the secret is "one-time" (Burn-on-read). This ensures that only the person with the full link (including fragment) can trigger the burn.

**Decryption happens in your browser.** We just serve the encrypted blob.

---

### `DELETE /api/destroy/:id`

**What it does:**
- Verifies the `destroyToken` (hashed comparison).
- Permanently deletes the secret from our database.

---

## What We Store

| Column | Can We Read Plaintext? |
|--------|-----------------------|
| `ciphertext` | ❌ No — encrypted |
| `iv` | Useless without password |
| `salt` | Useless without password |
| `ttl_mode` | ✅ Yes — just "24h" etc. |

**There is no plaintext anywhere.**

---

## What's Not Documented

For security, we don't publish:
- Rate limiting details
- CAPTCHA integration
- Infrastructure specifics

---

**Questions?** send an [email](https://antiscrape.xyz/u/69UeWM)
