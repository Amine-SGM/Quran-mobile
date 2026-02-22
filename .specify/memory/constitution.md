<!--
Sync Impact Report:
- Version change: 1.1.0 -> 1.1.1
- List of modified principles:
  - None (Refactoring phase initiated based on existing principles)
- Added sections: None
- Removed sections: None
- Templates requiring updates: ✅ updated
- Follow-up TODOs: Execute the codebase refactor to move shared directory contents into platform-specific directories (`mobile` and `desktop`) and update all imports accordingly, as requested by the user.
-->
# Quran Shorts Maker Constitution

## Core Principles

### I. Unified Codebase (No Shared Directory)
All application logic, APIs, and types MUST reside within their respective target platform directories (e.g., `mobile` or `desktop`). The use of a `shared` directory is strictly forbidden. Code must be structured independently within `mobile` or `desktop` to reduce cross-platform dependency complexity and simplify the build process.

### II. Privacy-First & Serverless
All processing, including video rendering and media generation, MUST happen securely on the user's device. Cloud backends are not permitted for media processing. Data remains with the user.

### III. TypeScript Strictness
Strict mode TypeScript is mandatory across all codebases. The use of `any` is strictly forbidden except at explicit, unavoidable IPC boundaries. Strong typing must be utilized for all internal interfaces and API responses.

### IV. Functional UI Development
All React components MUST be functional and utilize hooks. Class components are not allowed. Design tokens should be managed via CSS variables or localized styling solutions without relying on utility frameworks like Tailwind.

### V. High-Quality Processing & Exports
The application MUST support comprehensive export capabilities including multiple aspect ratios (9:16, 1:1, 4:5, 16:9) and high resolutions (720p, 1080p, 2K, 4K). Arabic text shaping must be perfectly preserved in generated subtitles.

## Technology Stack Constraints

- **Languages:** TypeScript 5.x exclusively
- **Frameworks:** React 18, React Native (Mobile), Electron (Desktop)
- **Media Processing:** FFmpeg (native binary on desktop, ffmpeg-kit-https on mobile), Node.js canvas for Arabic text shaping
- **APIs:** Pexels API (with user-provided keys, no hardcoded keys), Quran.com API v4

## Development Workflow

Development efforts must respect platform-specific boundaries. Since shared code is prohibited, any logically equivalent functionality must be purposefully duplicated or implemented contextually per platform (Desktop vs. Mobile). Local testing must be performed via `npm test` before pushing changes.

## Governance

This Constitution supersedes all prior architectural practices, specifically enforcing the deprecation of the `shared` directory. 

All pull requests and code reviews MUST verify compliance with the "No Shared Directory" principle and ensure that code remains strictly within its target project (`desktop` or `mobile`). Complexity must be justified.

**Version**: 1.1.1 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-22
