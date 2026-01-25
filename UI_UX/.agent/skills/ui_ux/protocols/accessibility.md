# Accessibility Protocol

## Why It Matters
~15% of people have some form of disability. Accessible design helps everyone.

---

## WCAG Quick Reference

### Perceivable

1. **Text Alternatives**
   - All images have alt text
   - Decorative images have empty alt=""

2. **Color Contrast**
   - Normal text: 4.5:1 minimum
   - Large text (18pt+): 3:1 minimum
   - Check with contrast checker tools

3. **Don't Rely on Color Alone**
   - Use icons, text, patterns in addition to color
   - Error states: icon + color + text

### Operable

4. **Keyboard Accessible**
   - All functions reachable by keyboard
   - Visible focus indicators
   - No keyboard traps

5. **Enough Time**
   - Pause/extend time limits
   - No auto-moving content without control

6. **Navigable**
   - Skip links for main content
   - Descriptive page titles
   - Logical focus order

### Understandable

7. **Readable**
   - Clear, simple language
   - Consistent terminology

8. **Predictable**
   - Consistent navigation
   - Consistent identification

9. **Input Assistance**
   - Clear labels for inputs
   - Error identification with suggestions
   - Confirmation for important actions

### Robust

10. **Compatible**
    - Valid HTML
    - ARIA labels where needed
    - Works with assistive technology

---

## Checklist for Every Screen

- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] All interactive elements keyboard accessible
- [ ] Focus order is logical
- [ ] Form inputs have labels
- [ ] Images have appropriate alt text
- [ ] Error messages are clear and helpful
- [ ] No information conveyed by color alone
- [ ] Touch targets at least 44x44px on mobile
