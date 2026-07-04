## 2025-05-15 - [Scroll Management and Actionable Empty States]
**Learning:** In mobile-first, paginated menu applications, users often reach the bottom of the page to navigate. Updating content without resetting scroll position causes confusion and breaks flow. Additionally, empty search results without a quick "Reset" action create a dead-end in the UX.
**Action:** Always implement smooth scroll-to-top on pagination changes and provide a prominent "Clear/Reset" button in empty states.

## 2025-05-15 - [Lightweight UI Polish for Premium Feel]
**Learning:** High-impact UI polish can be achieved without performance overhead by sticking to CSS properties that are cheap to animate (transform: translate/scale, opacity). Using `onLoad` for image fade-ins significantly reduces visual "jank" and makes the application feel more robust.
**Action:** Use subtle scaling (0.97-1.05) and translations (-1px to -4px) for interactive elements and always implement smooth image reveals.
