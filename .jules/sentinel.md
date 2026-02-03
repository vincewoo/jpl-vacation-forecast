## 2026-01-07 - Excessive Error Detail Leakage
**Vulnerability:** The application was logging raw error objects (including stack traces and potentially sensitive data) to `console.error` in production.
**Learning:** Developers often log full error objects for debugging, but this persists in production builds, exposing internal implementation details and potentially PII in browser console logs.
**Prevention:** Use a centralized logger that conditionally logs details based on the environment or sanitizes error objects to only show messages, preventing stack trace leakage.

## 2026-01-08 - Insecure Deserialization in Cloud Sync
**Vulnerability:** The application was automatically persisting data from Firebase to `localStorage` without validation. If the cloud data was corrupted or tampered with, it would permanently corrupt the local client state, leading to a persistent Denial of Service or potential injection attacks.
**Learning:** `localStorage` acts as a second persistence layer. Validating data only at the UI layer (React components) is insufficient if the synchronization layer (Service) blindly writes invalid data to the disk.
**Prevention:** Implement validation at the ingress point (the sync service) before writing to any persistence layer, not just before rendering.

## 2026-02-03 - Missing Egress Validation in Cloud Sync
**Vulnerability:** The application was syncing data from `localStorage` to Firebase without validating it against the registered schemas. This meant malicious or corrupted local data could be pushed to the cloud and propagated to other devices.
**Learning:** Security boundaries are bidirectional. We often focus on "ingress" validation (validating data coming IN to the system), but "egress" validation (validating data going OUT, especially from a lower-trust source like localStorage to a higher-trust one like the cloud) is equally critical to prevent pollution of the shared state.
**Prevention:** Ensure that `syncToCloud` (and any data promotion mechanism) applies the same strict validation rules as `syncFromCloud` or `get` operations.
