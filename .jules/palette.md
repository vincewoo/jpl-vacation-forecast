## 2025-01-09 - Calendar Keyboard Navigation
**Learning:** Users intuitively expect arrow keys to navigate calendar views, similar to image galleries.
**Action:** Implement global arrow key listeners for primary navigation components (like calendars) when no input is focused.

## 2025-01-09 - Accessible Loading States
**Learning:** Static "Loading..." text is visually jarring and often missed. Spinners provide better feedback but must be accessible.
**Action:** Use CSS animations for spinners and wrap them in a container with `aria-busy="true"`, `aria-live="polite"`, and `role="status"` to announce state changes to screen readers.
