# Security References and Checklist

This is a curated reference list for secure coding and application security. Use it when designing, reviewing, or hardening features in the Optimum stack (React 18 + TypeScript + Vite, Express 4 + TypeScript + Node.js 22, MySQL 8 + Prisma 7, Zod validation, JWT, Multer).

## OWASP Top 10:2025

A quick mapping of the OWASP Top 10:2025 to common work in this codebase.

1. **A01 — Broken Access Control** — Map to: route-level `authMiddleware`, `requireRole`, `assertClaimAccess`, `canAccessClaim`, and ownership checks before DB mutations.
2. **A02 — Security Misconfiguration** — Map to: helmet defaults, CORS/CSP policy, `.env` handling, removing public static mounts, and secure defaults.
3. **A03 — Software Supply Chain Failures** — Map to: lockfile hygiene, `npm audit`, dependency review, and install-script inspection.
4. **A04 — Cryptographic Failures** — Map to: bcrypt password hashing, `crypto.randomBytes` / `nanoid` for tokens, JWT signing, and cookie `httpOnly`/`secure`/`sameSite`.
5. **A05 — Injection** — Map to: Prisma parameterized queries, HTML-escaping before PDF/DOCX generation, and validating all external input.
6. **A06 — Insecure Design** — Map to: threat-modeling new features, allowlists for file types/hosts/actions, and deny-by-default authorization.
7. **A07 — Authentication Failures** — Map to: login rate limiting, strong password requirements, secure session cookies, and MFA when requested.
8. **A08 — Software or Data Integrity Failures** — Map to: magic-byte file validation, path containment, and rejecting unexpected request bodies.
9. **A09 — Security Logging and Alerting Failures** — Map to: `audit.service`, logging auth events and privilege changes, and keeping PII out of logs.
10. **A10 — Mishandling of Exceptional Conditions** — Map to: generic error responses, fail-closed logic, rate limiting, and explicit edge-case handling.

- OWASP Top 10:2025 — https://owasp.org/Top10/2025/
- OWASP Top 10:2021 (archived context) — https://owasp.org/Top10/

## OWASP Cheat Sheets

Relevant cheat sheets for this stack.

- Authentication — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Authorization — https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- Input Validation — https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- XSS Prevention — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- SQL Injection Prevention — https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- CSRF Prevention — https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Content Security Policy — https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- Cryptographic Storage — https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- Password Storage — https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Session Management — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- File Upload — https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Secure Code Review — https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html

## OWASP Standards and Guides

- OWASP Application Security Verification Standard (ASVS) — https://owasp.org/www-project-application-security-verification-standard/
- OWASP Secure Coding Practices Quick Reference — https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/stable-en/
- OWASP Testing Guide — https://owasp.org/www-project-web-security-testing-guide/
- OWASP Code Review Guide — https://owasp.org/www-project-code-review-guide/
- OWASP Software Component Verification Standard — https://owasp.org/www-project-software-component-verification-standard/

## Weaknesses and Vulnerability Lists

- 2025 CWE Top 25 — https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html
- CWE Top 25 (latest) — https://cwe.mitre.org/top25/
- CISA Secure by Design — https://www.cisa.gov/securebydesign

## Framework and Government Guidance

- NIST Secure Software Development Framework (SSDF) SP 800-218 — https://csrc.nist.gov/pubs/sp/800/218/r1/ipd
- NIST SSDF references — https://csrc.nist.gov/Projects/ssdf/references
- SAFECode Fundamental Practices for Secure Software Development — https://safecode.org/publication/safecode-fundamental-practices-for-secure-software-development-2024/

## Framework-Specific References

- Express security best practices — https://expressjs.com/en/advanced/best-practice-security.html
- React security best practices — https://react.dev/reference/react
- Prisma query safety — https://www.prisma.io/docs/orm/prisma-client/queries
- jsonwebtoken (JWT) — https://github.com/auth0/node-jsonwebtoken
- bcrypt — https://github.com/kelektiv/node.bcrypt.js
- helmet — https://helmetjs.github.io/
- express-rate-limit — https://express-rate-limit.magicjudges.com/

## Verification Checklist

Use this before committing security-relevant changes.

- [ ] All external input is validated at the trust boundary.
- [ ] Route-level authentication and authorization checks are in place.
- [ ] Database queries use Prisma/parameterization; no string concatenation.
- [ ] User-controlled output is encoded (HTML, headers, filenames).
- [ ] Secrets remain in environment variables, never in source or logs.
- [ ] Passwords are hashed with bcrypt; tokens use `crypto.randomBytes` or `nanoid`.
- [ ] File uploads are allowlisted by extension, MIME type, and magic bytes.
- [ ] Stored file paths are resolved only under `UPLOAD_DIR` / `REPORT_DIR`.
- [ ] Auth cookies are `httpOnly`, `secure` in production, and `sameSite='lax'`.
- [ ] Auth and expensive endpoints have rate limiting.
- [ ] Error responses are generic; internal details are logged server-side.
- [ ] Security events are logged without exposing PII, tokens, or passwords.
- [ ] `npm audit` is run and findings are triaged.
- [ ] Targeted tests are added/updated and pass for the changed security logic.
