# Changelog

## [1.4.1] - 2026-01-15

### Removed
- **Speech Recognition Feature**:
  - Completely removed voice dictation from Quick Capture and Editor due to Electron compatibility issues and persistent errors.
  - Removed "Voice" mode from Quick Capture (only "Note" and "Task" modes remain).
  - Removed microphone button from Editor toolbar.
  - Removed related global shortcut `Ctrl+Shift+D`.

### Fixed
- **Application Stability**:
  - Resolved `ReferenceError: speechError is not defined` and `ReferenceError: onMicToggle is not defined` which caused the application to crash.
  - Removed unused dependencies (`@xenova/transformers`, `vosk`, `fluent-ffmpeg`) to reduce build size and complexity.
  - Cleaned up `vite.config.js` and removed `whisper.worker.js`.


## [1.4.0] - 2026-01-11

### Added
- **Planning Calendar Redesign**:
  - **Apple Calendar Style**: Complete visual overhaul inspired by Apple Calendar
  - **Month/Week Switch**: New toggle to switch between Month and Week views
  - **Week View**: Vertical list of the current week's days with tasks
  - **Inline Task Creation**: Click on "Nouvelle tâche" in any day (month or week view) to create a task for that specific date immediately
  - **Responsive Design**: Mobile-friendly interface with simplified views and touch-optimized controls
  - **Day Detail View**: 
    - **Side Panel (Desktop)**: Clicking a day opens a side panel with details without losing context
    - **Full Screen (Mobile)**: Clicking a day opens a focused full-screen view
  - **Task Counts**: Visual indicators for the number of tasks per day

### Improved
- **Mobile Experience**:
  - Better touch targets for navigation and task management
  - Simplified calendar cells on mobile (initials only)
  - Bottom navigation bar integration
- **User Interface**:
  - "No tasks" empty states replaced with actionable "Add Task" buttons
  - Consistent styling with the rest of the application

## [1.3.0] - 2026-01-09

### Added
- **Mobile Support (Capacitor)**:
  - Native Android support implemented using Capacitor 
  - **Bottom Navigation Bar**: New mobile-specific navigation replacing the sidebar on small screens
  - **Platform Detection**: Smart detection of Electron vs Mobile vs Web environments
  - **Native Integration**: Status Bar styling and safe-area adaptation for notched devices
  - **Mobile-Specific UI**: 
    - Hidden TitleBar on mobile
    - Adapted padding and layout for touch interfaces
    - Disabled Electron-specific features (auto-updates) on mobile to prevent crashes

### Technical
- **Architecture**:
  - Added `src/utils/platform.js` for centralized platform logic
  - Integrated `MobileNav` component
  - Configured `capacitor.config.ts` for secure Android scheme (`https`)
- **Dependencies**:
  - Added `@capacitor/core`, `@capacitor/android`, `@capacitor/ios`
  - Added `@capacitor/status-bar`, `@capacitor/app`

## [1.2.0] - 2026-01-08

### Added
- **7 Task Categories**: Expanded from 2 to 7 categories with unique icons and colors
  - 💼 Travail (Work) - Blue briefcase
  - 🏠 Maison (Home) - Orange house
  - ❤️ Santé & Bien-être (Health & Wellness) - Red heart
  - 🎓 Apprentissage (Learning) - Green graduation cap
  - 💰 Finances - Yellow dollar sign
  - 🎉 Social & Loisirs (Social & Leisure) - Pink party popper
  - 💡 Idées / Vrac (Ideas / Misc) - Purple lightbulb

- **Enhanced Task Modal**:
  - Editable task title directly in modal header (replaces static "Détails de la tâche")
  - Custom completion status toggle with visual switch (green when completed, gray when not)
  - Category dropdown with icons and colors (replaces basic buttons)
  - Description field for detailed task notes (requires database migration)
  - Improved layout with status toggle at the top
  - Safety check to prevent null pointer errors

- **Custom Category Dropdowns**:
  - Dashboard task creation form now uses custom dropdown
  - TaskModal uses custom dropdown
  - Both dropdowns feature icons, colors, and scrollable lists
  - Auto-close functionality when clicking outside
  - Smooth animations and transitions

- **French Translation**: Complete French interface
  - Dashboard: "Gérez vos tâches et restez productif", "Ajouter une nouvelle tâche", "Ajouter"
  - Settings: All tabs (Apparence, Compte, Données, À propos), buttons, and notifications
  - Notes: "Nouvelle note", "Note sans titre", "Supprimer la note"
  - Sidebar: "Paramètres", "Déconnexion"
  - TaskModal: Already in French
  - Category labels: "Travail", "Personnel" (instead of "Work", "Personal")
  - Export options: "Google Agenda", "Télécharger .ics"
  - All error messages and notifications

- **Custom Scrollbars**: 
  - Elegant thin scrollbars (8px) matching the app's dark theme
  - Applied globally to all scrollable elements
  - Custom styling for webkit browsers (Chrome, Edge) and Firefox
  - Smooth hover effects
  - Uses CSS variables for theme consistency

- **Planning Page Improvements**:
  - Fixed tooltip positioning (now uses `position: fixed` to avoid overflow issues)
  - Tooltips display correctly even when calendar has overflow constraints
  - Dynamic coordinate calculation for accurate tooltip placement
  - Integrated TaskModal for editing tasks from calendar view

### Improved
- **Responsive Design**: 
  - Task creation form now uses `flex-wrap` to prevent overflow
  - Input field has `min-w-[200px]` to maintain usability
  - All form elements have `flex-shrink-0` to prevent unwanted compression
  - Form adapts gracefully to different screen sizes

- **Form Consistency**: 
  - All inputs and buttons standardized to 40px height (`h-10`)
  - Consistent padding and spacing across all form elements
  - Category dropdown width increased from `w-40` to `w-48` for better readability
  - Date input has fixed width (`w-40`) to prevent layout shifts

- **Category Display**: 
  - Visual category badges with icons in task lists
  - Color-coded categories for quick visual identification
  - Consistent icon sizing (16px) throughout the app

- **User Experience**:
  - Dropdowns close automatically when clicking outside (using `mousedown` event listener)
  - Dropdowns close after selecting an option
  - Smooth transitions and animations
  - Better visual feedback for interactive elements

### Fixed
- **Dropdown Auto-Close**: 
  - Added click-outside detection using `useEffect` hooks
  - Works in both Dashboard and TaskModal
  - Prevents dropdowns from staying open unintentionally

- **Responsive Layout**: 
  - Task creation form no longer overflows on narrow screens
  - Form wraps to multiple lines when needed
  - All elements remain accessible on small screens

- **Modal Stability**:
  - Added null check for `editedTask` to prevent crashes
  - Modal only renders when all required data is available

- **Tooltip Positioning**:
  - Fixed tooltips being cut off in Planning calendar
  - Tooltips now use fixed positioning with dynamic coordinates

### Technical Improvements
- **Code Organization**:
  - Centralized CATEGORIES constant in both Dashboard and TaskModal
  - Reusable category configuration with icon components
  - Consistent event handling patterns

- **Performance**:
  - Efficient event listener cleanup in useEffect hooks
  - Optimized re-renders with proper dependency arrays

- **Maintainability**:
  - Easy to add new categories (just add to CATEGORIES array)
  - Consistent styling patterns using Tailwind classes
  - Clear separation of concerns

### Database Changes Required
To use the new features, update your Supabase database:

```sql
-- Add description column to tasks table
ALTER TABLE tasks ADD COLUMN description TEXT;

-- Update category constraint to include new categories
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check 
  CHECK (category IN ('work', 'personal', 'home', 'health', 'learning', 'finance', 'social', 'ideas'));
```

## [1.1.1] - 2026-01-04

### Added
- **Auto-Update System**: Implemented electron-updater for automatic application updates
  - Background update checks
  - Update notification component with "Restart to Install" button
  - Manual update check from Settings page
  - GitHub releases integration for update distribution

### Fixed
- Custom title bar buttons (close, minimize, maximize) now functional
- Application icon now displays correctly (replaced default Electron logo)
- Update notification properly handles update events

### Technical
- Configured electron-builder for Windows, macOS, and Linux builds
- Set up GitHub releases as update provider
- Implemented IPC communication for update events

## [1.1.0] - 2026-01-04

### Added
- **Theme System**: Light, Dark, and System theme support
  - Theme context for global theme management
  - Persistent theme preference in localStorage
  - Smooth transitions between themes
  - Full UI adaptation to selected theme

### Improved
- **Code Blocks in Notes**: 
  - Syntax highlighting adapts to theme (One Light for light mode, One Dark for dark mode)
  - Background colors match theme
  - Better readability in both modes

- **UI Consistency**:
  - Removed hardcoded text colors in Dashboard, TitleBar, UpdateNotification, and Settings
  - All components now use theme-aware CSS variables
  - Hover states adapt to current theme

## [1.0.0] - 2026-01-04

### Initial Release
- **Task Management**:
  - Create, edit, and delete tasks
  - Mark tasks as complete/incomplete
  - Categorize tasks (Work/Personal)
  - Set due dates
  - Export to Google Calendar
  - Download tasks as .ics files

- **Notes System**:
  - Rich text editor powered by Tiptap
  - Syntax highlighting for code blocks (using Lowlight)
  - Image upload and storage
  - Auto-save functionality
  - Favorite/pin important notes
  - Search and organize notes

- **Planning Calendar**:
  - Monthly calendar view
  - Visual task display on calendar
  - Navigate between months
  - Quick task overview

- **Authentication**:
  - Secure login and signup with Supabase
  - Row Level Security (RLS) for data protection
  - User-specific data isolation

- **Desktop Application**:
  - Built with Electron for cross-platform support
  - Custom title bar
  - Native window controls
  - Offline-first capability

- **Database**:
  - Supabase backend
  - PostgreSQL database
  - Real-time data synchronization
  - Secure file storage for images

- **UI/UX**:
  - Modern, clean interface
  - Responsive design
  - Sidebar navigation
  - Dark theme (default)
  - Tailwind CSS styling
  - Lucide React icons

### Technical Stack
- React 18 + Vite
- Electron 28
- Supabase (Auth + Database + Storage)
- Tiptap (Rich Text Editor)
- Tailwind CSS
- React Router DOM
- Lowlight (Syntax Highlighting)
