# Implementation Plan: Refactor Mobile App

## 1. Technical Context
- **Target Platform**: React Native (Mobile)
- **Language**: TypeScript 5.x (Strict mode)
- **UI Architecture**: Functional React components with hooks.
- **Styling**: Localized styling solutions (`StyleSheet` with centralized `theme.ts` design tokens). Tailwind is prohibited per constitution.
- **Core Integrations**: Pexels API, Quran.com API v4, `ffmpeg-kit-react-native`, `react-native-fs`.

## 2. Constitution Check
- **[x] I. Unified Codebase**: The `shared` directory has been removed. All shared logic is localized into the mobile application.
- **[x] II. Privacy-First**: Media processing remains strictly on-device using `ffmpeg-kit-react-native`.
- **[x] III. TypeScript Strictness**: Enforced globally.
- **[x] IV. Functional UI**: All React components are strictly functional.
- **[x] V. High-Quality Processing**: Media generation pipelines support all defined aspect ratios and resolutions correctly.

## 3. Implementation Phases

### Phase 1: Architecture & Dependency Resolution
1. Set up Babel module resolver (`babel-plugin-module-resolver`) to support clean, absolute imports.
2. Relocate previously `shared/` logic (API clients, types, utilities) into the respective `src/api`, `src/types`, and `src/utils` directories.
3. Fix all broken imports across the app to map correctly to the new localized paths.
4. Verify TypeScript compilation (`tsc --noEmit`).

### Phase 2: UI/UX Redesign
1. **Design System Initialization**: Create a localized design token system (`src/theme/tokens.ts`) outlining colors, typography, sizing, and spacing using frontend design best practices.
2. **Screen Redesign**: 
   - Overhaul `HomeScreen` for a modern look (e.g., glassmorphism, flat design features as appropriate for React Native).
   - Refactor `SurahDetailScreen` and `ReciterScreen` with improved visual hierarchy, spacing, and typography.
   - Refactor `ExportScreen` to prominently and clearly display rendering progress.
3. Leverage `ui-ux-pro-max` styling patterns optimized for native mobile presentation.

### Phase 3: Core Functionality Restoration
1. Verify Quran.com API and Pexels API data fetching using the relocated clients.
2. Ensure local caching mechanisms using `react-native-fs` and `AsyncStorage` function properly.
3. Validate FFmpeg-kit integration for video rendering with the newly migrated utilities.

### Phase 4: Testing & Polish
1. Run local component and integration tests.
2. Profile and fix any 60fps performance bottlenecks or UI judder.