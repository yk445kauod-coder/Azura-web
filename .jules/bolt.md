## 2025-05-15 - [Menu Rendering Complexity]
**Learning:** The `MenuLightweight` component suffered from an $O(N \times C)$ bottleneck because category counts were calculated by filtering the entire menu items array for every single category pill on every render.
**Action:** Use a single-pass $O(N)$ aggregation with `useMemo` to pre-calculate all category counts. Additionally, use `React.memo` for menu cards and `useCallback` for event handlers to maintain referential stability and prevent unnecessary re-renders of the large list.
