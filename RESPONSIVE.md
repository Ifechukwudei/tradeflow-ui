# Mobile Responsive Features

The Tradeflow UI has been updated to be fully mobile-responsive.

## Key Features

### Responsive Sidebar
- **Desktop (≥1024px)**: Fixed sidebar always visible
- **Mobile/Tablet (<1024px)**: Hamburger menu with slide-out drawer
- Auto-closes when navigating on mobile
- Smooth slide animations

### Responsive Pages
All pages have been optimized for mobile:

- **Responsive padding**: `p-4 md:p-8` (smaller on mobile)
- **Flexible headers**: Stack vertically on mobile, horizontal on desktop
- **Scrollable tables**: Horizontal scroll on mobile with minimum widths
- **Responsive buttons**: Full width on mobile, auto width on desktop
- **Flexible pagination**: Stacks vertically on mobile
- **Responsive grids**: Single column on mobile, multi-column on desktop

### Breakpoints Used
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktops)

## Installation

```bash
cd projects/tradeflow-ui
npm install
npm run dev
```

## Dependencies Added
- `clsx` - Utility for constructing className strings
- `tailwind-merge` - Merge Tailwind CSS classes without conflicts

## Components Created
- `src/lib/utils.js` - Utility functions
- `src/components/ui/sheet.jsx` - Mobile drawer component
- `src/components/ui/button.jsx` - Button component
