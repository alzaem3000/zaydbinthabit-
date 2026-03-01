# Design Guidelines: School Performance Documentation System

## Design Approach
**System-Based Approach** - Material Design adapted for Arabic RTL educational administration, prioritizing clarity, data density, and professional administrative workflows.

## Core Design Principles
- **RTL-First**: Complete right-to-left layout optimization for Arabic interface
- **Information Hierarchy**: Clear visual separation between statistics, actions, and content
- **Professional Authority**: Convey institutional credibility through structured, organized layouts
- **Multi-Role Interface**: Seamless experience for principals, supervisors, and teachers

## Typography System

**Font Stack**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif (Arabic-optimized)

**Hierarchy**:
- School Title: 2rem (32px), bold
- Page Titles: 1.5rem (24px), medium
- Section Headers: 1.3rem (21px), bold
- Card Titles: 1.1rem (18px), bold
- Body Text: 1rem (16px), regular
- Small Labels: 0.9rem (14px), regular
- Stat Numbers: 2.5rem (40px), bold

## Layout System

**Spacing Primitives**: Tailwind units 2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30
- Container padding: p-5
- Card padding: p-6 to p-8
- Element gaps: gap-4 to gap-5
- Section margins: mb-5 to mb-8

**Grid Structure**:
- Main Layout: 2-column (300px sidebar + flexible main)
- Stats Grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Indicators Grid: 3 columns minimum 300px width
- Forms: Single column with full-width inputs

**Container Max-widths**:
- Main container: max-w-7xl (1400px)
- Modal content: max-w-2xl (600px)
- Forms: max-w-prose for readability

## Component Library

### Navigation & Structure

**Header Component**:
- Full-width spanning both columns
- School title centered prominently
- Management info in 2-column grid below title
- Statistics cards in 4-column grid at bottom
- Border-right accent (5px) for visual hierarchy

**Sidebar**:
- Fixed 300px width
- Profile section at top (centered avatar, name, role)
- Info groups with labeled fields stacked vertically
- Each group separated by bottom border
- Sticky positioning for scroll behavior

### Data Display

**Stat Cards**:
- Gradient backgrounds (subtle, professional)
- Large numbers centered (2.5rem)
- Descriptive labels below (0.9rem)
- Rounded corners (10px)
- White text on colored background

**Indicator Cards**:
- Border: 2px solid with hover state
- Rounded corners: 10px
- Header: flex layout with title and status badge
- Witness count in centered container
- Criteria list with divider lines
- Action buttons at bottom

**Status Badges**:
- Pill shape (rounded-full)
- Small text (0.8rem)
- Padding: py-1 px-3
- Different styles for: pending, in-progress, completed

### Interactive Elements

**Buttons**:
- Primary: filled background, white text, 10px padding, 8px radius
- Secondary: transparent background, 2px border, colored text
- Hover: slight upward transform (-2px translateY)
- Consistent font weight: bold

**Quick Action Cards**:
- Grid layout (auto-fit, 200px minimum)
- Border-based design (not filled)
- Hover: border color change + subtle lift transform
- Text centered with icon/title combination

### Forms & Inputs

**Input Fields**:
- Full width within container
- 12px padding
- 2px border
- 8px border radius
- Focus state: border color change (no outline)

**Form Groups**:
- Vertical label above input
- Label bold and colored
- 20px bottom margin between groups

**File Upload Areas**:
- Dashed border for drop zone
- Centered icon and text
- Hover state for interactivity

### Modals & Overlays

**Modal Structure**:
- Semi-transparent backdrop (rgba overlay)
- Centered white container
- 30px padding
- 15px border radius
- Max-height 90vh with scroll
- Max-width 600px

**Notification Toast**:
- Fixed position: top-20 right-20
- Colored background (success/warning/error)
- White text, 15px padding
- 10px border radius
- Auto-dismiss functionality

## Animations & Interactions

**Use Sparingly**:
- Hover transforms on cards/buttons (translateY -2px to -5px)
- Smooth transitions: 0.3s ease for all interactive elements
- No page load animations
- No scroll-triggered animations
- Modal fade-in only (0.2s)

## Responsive Behavior

**Breakpoints**:
- Desktop: 768px+ (2-column layout)
- Tablet: 768px (single column, stats 2-column)
- Mobile: <768px (all single column, full-width cards)

**Mobile Adaptations**:
- Sidebar becomes top section
- Stats grid: 2 columns
- Indicators grid: 1 column
- Management info: stacked vertically
- Reduced padding (p-4 instead of p-6)

## Images

**Profile Avatars**:
- Circular (50% border-radius)
- 80px × 80px in sidebar
- 40px × 40px in lists/tables
- Border: 3px solid accent color
- Placeholder: initials or icon if no image

**Document Icons**:
- Standard file type icons (PDF, DOC, etc.)
- 24px × 24px in lists
- Positioned to right of filename (RTL)

**No Hero Image Required** - This is an administrative dashboard focused on data and functionality, not marketing.

## RTL-Specific Considerations

- All text alignment: right
- Flexbox direction: row-reverse where needed
- Border accents: right side (not left)
- Icon positioning: right of text
- Padding/margin: reversed (pr/pl swap)
- Grid flow: RTL natural order
- Number formatting: Arabic-Indic numerals option

## Data Density Patterns

**Dashboard Statistics**:
- Large numbers with small labels
- 4-card grid on desktop
- Color-coded by category (subtle gradients)

**Tables/Lists**:
- Zebra striping for readability
- Hover state on rows
- Right-aligned text (RTL)
- Action buttons on far left

**Progress Indicators**:
- Percentage badges
- Visual progress bars where applicable
- Status colors (pending/in-progress/complete)

## Accessibility

- Consistent 1.6 line-height for readability
- Minimum 12px font size
- High contrast text on backgrounds
- Focus states for all interactive elements
- Semantic HTML structure
- ARIA labels for icons and actions