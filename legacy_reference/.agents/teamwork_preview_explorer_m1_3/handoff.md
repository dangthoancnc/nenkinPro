# Handoff Report: Milestone 1 (Responsive UI)

## Observation
- The layout is currently managed in `src/components/LayoutWrapper.tsx`, rendering `Sidebar` and `Topbar`.
- The `Sidebar` component (`src/components/Sidebar.tsx`) currently hardcodes its navigation links (`menuItems`) inline and lacks specific responsive classes to hide it on mobile screens.
- Tabular data is displayed using both native HTML `<table>` (in `src/app/applications/page.tsx`) and the `Table` component from `src/components/ui/Table.tsx` (in `src/app/customers/page.tsx`, `src/app/hr/page.tsx`, `src/app/page.tsx`, and `src/app/tax-offices/page.tsx`). These are currently full desktop tables that don't scale well down to mobile width.
- A `BottomNavigationBar` component does not yet exist.

## Logic Chain
1. **Shared Navigation**: Since the Sidebar and the new BottomNavigationBar need to share the same links, the `menuItems` array from `Sidebar.tsx` should be extracted to a shared file, e.g., `src/lib/navigation.ts`.
2. **BottomNavigationBar Creation**: We must create `src/components/BottomNavigationBar.tsx`. It will map through the shared `menuItems` and use Tailwind classes like `md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-around p-2` to appear only on mobile.
3. **Layout Wrapper Adjustment**: In `src/components/LayoutWrapper.tsx`, the `Sidebar` wrapper needs to be hidden on mobile (e.g., using `hidden md:block`). The new `BottomNavigationBar` should be added, and the `<main>` wrapper needs bottom padding (e.g., `pb-20 md:pb-6`) on mobile so the content isn't obscured by the fixed nav bar.
4. **Table to Card Refactor**: For each staff portal page (`applications`, `customers`, `hr`, `dashboard (page.tsx)`, `tax-offices`), the tables should be wrapped in `<div className="hidden md:block">`. Alongside it, we need to introduce a mobile view using `<div className="md:hidden flex flex-col gap-4">` that maps over the same data and renders the records as `<Card>` blocks.

## Caveats
- Loading and empty states inside the tables currently use `colSpan`. These will need to be explicitly handled in the mobile card list view (e.g., showing a mobile-specific loading spinner or empty placeholder when data is empty).
- The `Topbar` might look slightly compressed on mobile width, but modifying it is outside the direct scope unless it breaks layout. The scope only explicitly demands Sidebar/BottomNavigationBar toggling.

## Conclusion
To fulfill Milestone 1:
1. Extract `menuItems` to `src/lib/navigation.ts`.
2. Create `src/components/BottomNavigationBar.tsx` using `menuItems`.
3. Update `src/components/Sidebar.tsx` to use the extracted `menuItems`.
4. Update `src/components/LayoutWrapper.tsx` to toggle `Sidebar` and `BottomNavigationBar` based on viewport (`md:block` / `md:hidden`) and add appropriate bottom padding to `<main>`.
5. Update `applications`, `customers`, `hr`, `tax-offices`, and the dashboard (`page.tsx`) to split their list layouts into desktop (`hidden md:block`) tables and mobile (`md:hidden`) card lists.

## Verification Method
1. Start the application (`npm run dev`).
2. Open the app in a browser and toggle device emulation to a mobile viewport (<768px).
3. Verify the `Sidebar` disappears and the `BottomNavigationBar` appears at the bottom.
4. Verify navigation via the `BottomNavigationBar` works correctly.
5. Navigate to `/`, `/applications`, `/customers`, `/hr`, and `/tax-offices` to ensure the tables are no longer visible on mobile and are instead replaced by a vertical list of cards.
6. Verify no layout breakage occurs during data loading or on empty data states on mobile.
