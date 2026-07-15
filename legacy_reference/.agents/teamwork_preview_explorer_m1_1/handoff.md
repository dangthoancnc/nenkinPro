# Handoff Report: Milestone 1 (Responsive UI)

## Observation
- `src/components/LayoutWrapper.tsx` currently renders `Sidebar` on all screen sizes and applies margin (`ml-64` or `ml-20`) on all screens.
- `src/components/Sidebar.tsx` has a hardcoded array `menuItems` that defines the navigation links.
- `src/app/page.tsx`, `src/app/applications/page.tsx`, `src/app/customers/page.tsx`, `src/app/tax-offices/page.tsx`, and `src/app/hr/page.tsx` contain tables to display data. Most of them use `src/components/ui/Table`, except `applications` which uses a native `<table>`.
- None of the tables have a responsive mobile card list view.

## Logic Chain
1. To make the architecture mobile-first and hide the sidebar on mobile, `LayoutWrapper.tsx` needs to add `hidden md:block` to the `Sidebar`'s wrapper `div`, and change the `margin-left` classes to only apply on desktop (`md:ml-64` instead of `ml-64`, `md:ml-20` instead of `ml-20`).
2. We must create a new component `src/components/BottomNavigationBar.tsx` that will be rendered inside `LayoutWrapper.tsx`. It needs to have `block md:hidden` and be fixed at the bottom (`fixed bottom-0 left-0 right-0 z-50`).
3. Since both nav components must use the exact same links, we should extract `menuItems` from `Sidebar.tsx` into a shared file like `src/lib/constants/navigation.ts`, and import it in both `Sidebar.tsx` and `BottomNavigationBar.tsx`.
4. The `main` wrapper in `LayoutWrapper.tsx` needs `pb-20 md:pb-6` so the bottom navigation doesn't overlap content on mobile.
5. In each of the staff portal pages, we must wrap the `<Table>` (or `<table>`) in a `hidden md:block` container, and right below it, add a `block md:hidden` container that maps over the same data but renders it as a list of Cards (e.g. using `div` with `border rounded-lg p-4`).

## Caveats
- `menuItems` contains 7 items. A bottom navigation bar typically holds 4-5 items comfortably. To support 7 items, `BottomNavigationBar` needs horizontal scrolling (`overflow-x-auto flex flex-nowrap`) or a "More" dropdown. For now, horizontal scrolling with `flex-shrink-0` on items is the most straightforward responsive approach.
- `src/app/applications/page.tsx` uses a native `<table>` rather than the UI component `<Table>`, but the refactoring approach is identical.
- `src/app/finance` does not exist yet (as seen from grep failure), but its menu item is present.

## Conclusion
The implementer needs to:
1. **Extract Navigation Links:** Create `src/lib/constants/navigation.ts` (or similar) with the `menuItems` array (and import `lucide-react` icons). Import and use it in `Sidebar.tsx`.
2. **Create BottomNavigationBar:** Create `src/components/BottomNavigationBar.tsx` using the extracted links. Apply horizontal scrolling for mobile viewing.
3. **Update LayoutWrapper:** 
   - Add `<BottomNavigationBar />`.
   - Update sidebar wrapper with `hidden md:block`.
   - Update main content margins (`md:ml-64` / `md:ml-20`).
   - Add padding-bottom `pb-20 md:pb-6` to `<main>`.
4. **Refactor Tables to Card Lists:** In the 5 portal pages (`page.tsx`, `applications`, `customers`, `tax-offices`, `hr`), wrap the table in `hidden md:block` and implement a corresponding mobile view in `block md:hidden` using a flex/grid card layout for the exact same mapped data.

## Verification Method
- **Responsive Navigation:** Resize browser below 768px. Sidebar must disappear. BottomNavigationBar must appear and have working links. Check that content is not hidden behind the bottom bar.
- **Responsive Tables:** On mobile, verify that tables in all 5 pages turn into card lists and display the same data points (e.g. status, name, date).
- **Code validation:** Run `npm run build` to ensure no TypeScript errors from the extracted constants.
