## 2026-01-07 - Excessive Error Detail Leakage
**Vulnerability:** The application was logging raw error objects (including stack traces and potentially sensitive data) to `console.error` in production.
**Learning:** Developers often log full error objects for debugging, but this persists in production builds, exposing internal implementation details and potentially PII in browser console logs.
**Prevention:** Use a centralized logger that conditionally logs details based on the environment or sanitizes error objects to only show messages, preventing stack trace leakage.

## 2026-01-08 - Insecure Deserialization in Cloud Sync
**Vulnerability:** The application was automatically persisting data from Firebase to `localStorage` without validation. If the cloud data was corrupted or tampered with, it would permanently corrupt the local client state, leading to a persistent Denial of Service or potential injection attacks.
**Learning:** `localStorage` acts as a second persistence layer. Validating data only at the UI layer (React components) is insufficient if the synchronization layer (Service) blindly writes invalid data to the disk.
**Prevention:** Implement validation at the ingress point (the sync service) before writing to any persistence layer, not just before rendering.

## 2026-10-24 - Missing Security Headers in SPA
**Vulnerability:** The Single Page Application lacked security headers (CSP, Referrer-Policy), increasing exposure to XSS and data leakage.
**Learning:** In static hosting environments where HTTP headers cannot be easily configured, `<meta>` tags in `index.html` serve as a critical fallback for enforcing security policies like CSP.
**Prevention:** Include robust `Content-Security-Policy` and `Referrer-Policy` meta tags in the application's HTML entry point by default.
