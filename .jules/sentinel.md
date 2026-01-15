## 2026-01-07 - Excessive Error Detail Leakage
**Vulnerability:** The application was logging raw error objects (including stack traces and potentially sensitive data) to `console.error` in production.
**Learning:** Developers often log full error objects for debugging, but this persists in production builds, exposing internal implementation details and potentially PII in browser console logs.
**Prevention:** Use a centralized logger that conditionally logs details based on the environment or sanitizes error objects to only show messages, preventing stack trace leakage.

## 2026-01-08 - Insecure Deserialization in Cloud Sync
**Vulnerability:** The application was automatically persisting data from Firebase to `localStorage` without validation. If the cloud data was corrupted or tampered with, it would permanently corrupt the local client state, leading to a persistent Denial of Service or potential injection attacks.
**Learning:** `localStorage` acts as a second persistence layer. Validating data only at the UI layer (React components) is insufficient if the synchronization layer (Service) blindly writes invalid data to the disk.
**Prevention:** Implement validation at the ingress point (the sync service) before writing to any persistence layer, not just before rendering.

## 2026-01-09 - Insufficient Input Validation (Type vs. Constraint)
**Vulnerability:** The application's data validation logic (`isValidUserProfile`, etc.) only verified data types (e.g., `typeof string`) but failed to enforce length or range constraints. This exposed the application to potential Denial of Service (DoS) or storage exhaustion attacks via massive strings or numbers.
**Learning:** Type checking alone is not security validation. A valid "string" can be 100MB long. Validation layers must enforce business logic constraints (max length, max value) in addition to types.
**Prevention:** Implement explicit constraint checks (maxLength, max value) in both the UI layer (for UX) and the storage/service layer (for security).
