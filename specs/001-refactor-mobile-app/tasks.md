# Task Plan: Refactor Mobile App

## 1. Execution Strategy
- **Approach**: We will first configure the new absolute import paths and relocate all previously shared code into the mobile root structure. After ensuring the app compiles, we'll establish a design system. Finally, we'll iteratively revamp the screens corresponding to the user stories and test functionality.
- **Dependencies**: Setup phase (T001-T006) must be completed before any UI redesign tasks can begin. Design system (T007) must be completed before screen redesigns.
- **Parallelization**: Screen redesigns (T010, T011, T012) can be executed in parallel since they are independent UI components.

## Phase 1: Setup & Architecture
**Goal**: Resolve all broken paths and configure absolute imports.
- [x] T001 Configure babel-plugin-module-resolver for clean imports in `babel.config.js`
- [x] T002 Relocate previously shared API clients into `src/api/`
- [x] T003 Relocate previously shared types into `src/types/`
- [x] T004 Relocate previously shared utilities into `src/utils/`
- [x] T005 Fix broken imports across all application files to use the new module resolver paths
- [x] T006 Verify TypeScript compilation locally by running `tsc --noEmit`

## Phase 2: Foundational 
**Goal**: Establish the base UI/UX design tokens.
- [x] T007 Create localized design token system outlining colors, typography, sizing, and spacing in `src/theme/tokens.ts`

## Phase 3: User Story 1 - App Launch & Home Screen
**Goal**: App loads without missing module errors and displays a completely redesigned, modern home screen.
- [x] T008 [US1] Verify app entry point integrity to ensure no startup crashes in `App.tsx` (or `index.js`)
- [x] T009 [US1] Redesign the home screen using the new design tokens and glassmorphism/flat design concepts in `src/screens/HomeScreen.tsx`

## Phase 4: User Story 2 - Core Features & Navigation
**Goal**: All navigation (Surah, Reciter, Export) is smooth, intuitive, and underlying data fetching functions correctly.
- [x] T010 [P] [US2] Overhaul visual hierarchy, spacing, and typography in `src/screens/SurahDetailScreen.tsx`
- [x] T011 [P] [US2] Overhaul visual hierarchy, spacing, and typography in `src/screens/ReciterScreen.tsx`
- [x] T012 [P] [US2] Redesign rendering progress display prominently in `src/screens/ExportScreen.tsx`
- [ ] T013 [US2] Verify and integrate relocated Quran.com and Pexels API clients across the redesigned screens
- [ ] T014 [US2] Test and ensure local caching mechanisms (RNFS, AsyncStorage) function properly in the media fetching flows
- [] T015 [US2] Validate FFmpeg-kit integration and rendering utilities using the newly migrated paths in `src/services/ffmpeg-service.ts` (or equivalent)

## Phase 5: Polish & Cross-Cutting Concerns
**Goal**: Ensure performance criteria and test passing.
- [ ] T016 Run local component and integration tests across the refactored app
- [ ] T017 Profile application navigation and fix any 60fps performance bottlenecks or UI judder