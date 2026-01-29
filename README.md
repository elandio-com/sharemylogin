# ShareMyLogin — Encryption Library

**Open source cryptographic core for zero-knowledge credential sharing.**

This repository contains **only the client-side encryption code** used by [ShareMyLogin](https://sharemylogin.com). We publish this so you can verify our zero-knowledge claims.

---

## What You Can Verify

1. ✅ Encryption happens **in your browser**, not on our servers
2. ✅ We use **AES-256-GCM** encryption
3. ✅ Key derivation uses **PBKDF2 with 250,000 iterations**
4. ✅ We **never see your plaintext data or password**
5. ✅ The authentication tag is validated on decryption

---

## Files

| File | Purpose |
|------|---------|
| `encrypt.ts` | Client-side encryption |
| `decrypt.ts` | Client-side decryption |
| `schema.sql` | Database schema (proves no plaintext stored) |
| `API.md` | API behavior overview |

---

## What's Intentionally Private

For security, the following are **not published**:
- Rate limiting and abuse prevention
- CAPTCHA integration
- Backend infrastructure details

This is standard practice. The cryptographic code is public so you can verify our claims.

---

## Audit This Code

We encourage security researchers to:
- Review the encryption implementation
- Verify our zero-knowledge claims
- Report vulnerabilities to security@sharemylogin.com

---

## License

MIT License

**Built by [Elandio](https://elandio.com)**
