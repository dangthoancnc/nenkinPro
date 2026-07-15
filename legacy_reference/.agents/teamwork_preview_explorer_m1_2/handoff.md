# Handoff Report: Milestone 1 (Responsive UI) Exploration

## Observation
- **Architecture & Scope**: The project requires a mobile-first responsive UI. The Sidebar must be hidden on mobile (<768px) and replaced with a BottomNavigationBar. Both navs must share the same links. Tables in the staff portal must be converted to Card Lists on mobile.
- **Current Layout Structure**: 
  - `src/components/LayoutWrapper.tsx` renders the `Sidebar` and `Topbar`. It sets left margins (`ml-64` or `ml-20`) on the main content area regardless of viewport size.
  - `src/components/Sidebar.tsx` has `menuItems` hardcoded and remains visible on all screen sizes (no mobile-hidden classes on its container).
  - `src/components/Topbar.tsx` has a `<Menu>` button intended to toggle the sidebar, which won't be needed on mobile if the sidebar is completely hidden.
- **Current Tables**: The staff portal relies heavily on tabular data. The following files render tables that need mobile card list equivalents:
  - `src/app/page.tsx`: Displays a table of `recentApplications`.
  - `src/app/customers/page.tsx`: Displays a `customers` table in the List View section at the bottom.
  - `src/app/tax-offices/page.tsx`: Displays a `taxOffices` table.
  - `src/app/hr/page.tsx`: Displays a `staffs` table.
  - `src/app/applications/page.tsx`: Uses a native `<table>` to display `applications`.

## Logic Chain
1. To ensure the `Sidebar` and `BottomNavigationBar` use the same links without code duplication, the `menuItems` array should be extracted from `Sidebar.tsx` into a shared configuration file (e.g., `src/config/navigation.ts`).
2. To implement the mobile-first layout, `LayoutWrapper.tsx` must hide the `Sidebar` wrapper on mobile (`hidden md:block`) and adjust the main content's margin-left to only apply on desktop (`md:ml-64` and `md:ml-20`). It also needs to render the new `BottomNavigationBar` and add padding-bottom (`pb-16`) to the main content area so content isn't obscured by the fixed bottom nav.
3. The `BottomNavigationBar` component needs to be created, utilizing the shared navigation config. It should be fixed to the bottom of the screen and hidden on desktop (`md:hidden`).
4. To fulfill the requirement of refactoring tables into card lists on mobile, each identified table in the staff portal needs a responsive wrapper:
   - Wrap the existing table (or its `overflow-x-auto` container) with `hidden md:block`.
   - Add a sibling `div` with `flex flex-col gap-4 md:hidden` that maps over the data array and renders a summary `<Card>` for each item.

## Caveats
- `src/app/applications/page.tsx` uses a native `<table>` instead of the shared `<Table>` UI component. The refactoring approach (hide table, show cards) remains the same.
- 7 navigation items might be visually cramped in a standard `BottomNavigationBar`. The container should use `overflow-x-auto` (or a tight `flex-nowrap` layout) to ensure all icons and text remain accessible without breaking the layout.
- The `src/app/portal` directory appears to be a separate customer-facing portal with its own layout. It does not contain staff portal tables and is therefore excluded from the table refactoring scope.

## Conclusion
The investigation is complete and the codebase is ready for the Milestone 1 implementations. The required updates are scoped to:
1. Creating `src/config/navigation.ts` and `src/components/BottomNavigationBar.tsx`.
2. Updating `LayoutWrapper.tsx`, `Sidebar.tsx`, and `Topbar.tsx` to handle responsive visibility and margins.
3. Modifying 5 specific page files (`app/page.tsx`, `app/customers/page.tsx`, `app/tax-offices/page.tsx`, `app/hr/page.tsx`, `app/applications/page.tsx`) to add mobile `<Card>` list views alongside the desktop tables.

## Verification Method
1. Run `npm run dev` (or `uv run`/project-specific runner).
2. Open the application in a browser and toggle the viewport size between mobile (<768px) and desktop (≥768px).
3. **Verify Layout**: On mobile, the Sidebar should disappear, the left margin should be 0, and the BottomNavigationBar should appear fixed at the bottom. The Topbar menu icon should be hidden.
4. **Verify Navigation**: The links in the BottomNavigationBar should match the Sidebar and correctly highlight the active route.
5. **Verify Tables**: Navigate to the Dashboard, Customers, Tax Offices, HR, and Applications pages. On desktop, the tabular view should be visible. On mobile, the tables should be hidden and replaced by a stacked list of Cards displaying the same data.
