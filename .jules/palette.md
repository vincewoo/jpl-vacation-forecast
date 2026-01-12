## 2025-01-09 - Calendar Keyboard Navigation
**Learning:** Users intuitively expect arrow keys to navigate calendar views, similar to image galleries.
**Action:** Implement global arrow key listeners for primary navigation components (like calendars) when no input is focused.

## 2025-01-09 - Accessible Loading States
**Learning:** Static "Loading..." text is visually jarring and often missed. Spinners provide better feedback but must be accessible.
**Action:** Use CSS animations for spinners and wrap them in a container with `aria-busy="true"`, `aria-live="polite"`, and `role="status"` to announce state changes to screen readers.

## 2025-01-10 - Form Grouping
**Learning:** Groups of related inputs (like radio buttons) are often implemented as loose divs, which fails to programmatically associate the group label with the options for screen readers.
**Action:** Always wrap radio button groups in a `<fieldset>` with a `<legend>`. Use CSS to remove the default border and padding if a cleaner look is desired, ensuring the `legend` is styled consistently with other labels.

## 2025-01-20 - Modal Accessibility
**Learning:** Custom modals often trap users if they lack standard accessibility features like ARIA roles, label association, and keyboard dismiss support (Escape key). A visible close button is also critical for mouse users who might miss the "Cancel" action.
**Action:** Ensure all modals have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`. Always include a visible "X" close button and implement a `useEffect` to handle the `Escape` key for dismissal.
