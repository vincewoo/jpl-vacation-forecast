## 2026-01-07 - Excessive Error Detail Leakage
**Vulnerability:** The application was logging raw error objects (including stack traces and potentially sensitive data) to `console.error` in production.
**Learning:** Developers often log full error objects for debugging, but this persists in production builds, exposing internal implementation details and potentially PII in browser console logs.
**Prevention:** Use a centralized logger that conditionally logs details based on the environment or sanitizes error objects to only show messages, preventing stack trace leakage.

## 2026-01-08 - Insecure Deserialization in Cloud Sync
**Vulnerability:** The application was automatically persisting data from Firebase to `localStorage` without validation. If the cloud data was corrupted or tampered with, it would permanently corrupt the local client state, leading to a persistent Denial of Service or potential injection attacks.
**Learning:** `localStorage` acts as a second persistence layer. Validating data only at the UI layer (React components) is insufficient if the synchronization layer (Service) blindly writes invalid data to the disk.
**Prevention:** Implement validation at the ingress point (the sync service) before writing to any persistence layer, not just before rendering.

## 2026-01-09 - Unbounded User Inputs
**Vulnerability:** User inputs for vacation descriptions and balances lacked length/value limits, potentially allowing excessive data payload or processing issues.
**Learning:** React forms often rely on default input behaviors. Explicitly defining `maxLength` and `max` attributes is a necessary defense-in-depth step.
**Prevention:** Implement a two-tiered validation strategy: strict UI constraints (e.g., `maxLength=500`) for user guidance, and looser 'sanity limits' (e.g., 2000 chars) in data validation utilities to prevent abuse without risking data loss.
