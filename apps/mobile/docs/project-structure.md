# Dr Dendê — Project Structure Guide

## Overview

React Native mobile app built with **Expo SDK 54** (New Architecture enabled), using **expo-router v6** for file-based routing, **Jotai** for state management, and **Axios** for API communication. Package manager is **pnpm** (Node >= 24.3.0).

---

## Root Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts (`gen-apk-release`, `draft`, `deploy`, `pre-build:clean`, etc.) |
| `app.json` | Expo app config — plugins (Realm, expo-font with Fira Sans), `userInterfaceStyle: "automatic"`, New Architecture enabled |
| `tsconfig.json` | Strict TypeScript, path alias `@/*` → project root |
| `biome.json` | Formatter/linter: tabs, 100 char width, double quotes, semicolons, LF |
| `eas.json` | EAS Build profiles: `development`, `development-simulator`, `preview`, `production` |
| `build-version.json` | Tracks `buildNumber`, `version`, `updateVersion`, `lastUpdated` |
| `metro.config.js` | Expo Metro bundler config |
| `expo-env.d.ts` | Expo TypeScript ambient declarations |

---

## Folder Structure & Purposes

### `src/app/` — File-based Routes (expo-router)

Every folder/file maps to a route. Layouts are `_layout.tsx`, entry points are `index.tsx`.

```
src/app/
├── _layout.tsx          # Root layout: Jotai Provider, QueryProvider, AuthProvider, splash screen, auth gating
├── index.tsx            # Entry redirect → /login or /(protected) based on auth state
├── (auth)/              # Public routes (unauthenticated)
│   ├── login.tsx
│   ├── sign-in.tsx
│   └── forgot-pass.tsx
└── (protected)/         # Auth-gated routes
    ├── _layout.tsx      # Adds SafeAreaView + StatusBar + Slot
    ├── index.tsx        # Redirects to tabs
    ├── (tabs)/          # Bottom tab navigation (5 tabs: home, events, establishments, dishes, search)
    │   ├── _layout.tsx  # Custom AppTabs component (not expo-router's built-in)
    │   └── [tab]/       # Each tab: own _layout.tsx + index.tsx
    └── account/         # Account management section with own layout
```

**Conventions:**
- All stacks use `headerShown: false` — custom `Header` component is used instead
- Route groups `(auth)` and `(protected)` control auth gating from root layout

### `src/api/` — API Layer

```
src/api/
├── axios.config.ts      # Axios instance with env-based baseURL + Bearer token interceptor
└── endpoints/           # One file per domain, each exports a service object with async methods
    ├── auth.ts          # POST /sessions (login)
    ├── jobs.ts          # CRUD for jobs (types co-located: Job, JobCreate, etc.)
    ├── companies.ts
    ├── users.ts
    ├── supports.ts
    ├── third-parties.ts
    ├── ibge.ts          # Brazilian geography API
    ├── jobReport.ts
    ├── report-types.ts
    ├── reports-draft.ts
    ├── bulk-sync.ts     # Offline sync operations
    └── ...
```

**Pattern:** Each endpoint file exports an object literal with async methods + co-located TypeScript request/response types.

### `src/atoms/` — Jotai State Management

```
src/atoms/
├── store.ts             # Global Jotai store instance
├── auth.atoms.ts        # userAtom, tokenAtom, isAuthenticatedAtom (persisted to SecureStore/AsyncStorage)
├── token.ts             # tokenAtom with custom SecureStore-backed storage adapter
└── api/
│   ├── companies.ts     # atomWithQuery for companies data
│   └── locations.ts     # atomWithQuery for IBGE locations
└── mutation/
    └── ...              # atomWithMutation for write operations (e.g., forgot-pass)
```

**Pattern:** Data fetching uses `atomWithQuery` (jotai-tanstack-query), mutations use `atomWithMutation`. Atoms suffixed with `Atom` (e.g., `userAtom`, `tokenAtom`). Auth atoms are persisted via custom storage adapters (SecureStore for token, AsyncStorage for user data).

### `src/auth/` — Authentication Flow

```
src/auth/
├── auth.provider.tsx    # React Context: login/logout/signIn/forgotPassword + network awareness
├── auth.toast.ts        # Toast notifications for auth events
├── token-refresh.ts     # Token expiry check and refresh logic
└── use-auth-states.ts   # Hook to read/write token + user atoms
```

**Flow:** Login → save token (SecureStore) + user (AsyncStorage) + optional credentials persistence → route guard in root layout redirects accordingly. Logout clears query cache, resets atoms, removes stored data.

### `src/components/` — Component Library

```
src/components/
├── accordion.tsx        # Standalone accordion
├── LazyLoad.tsx         # Lazy loading wrapper
├── app-defaults/        # Design system primitives (prefixed "app-")
│   ├── app-button.tsx
│   ├── app-input.tsx
│   ├── app-text.tsx
│   ├── app-select.tsx
│   ├── app-tabs.tsx
│   ├── app-layout.tsx   # Reusable Stack with standard screen options
│   ├── app-list.tsx
│   ├── app-list-with-tabs.tsx
│   └── app-modal/       # Modal: app-modal.tsx, content.tsx, styles.ts
└── ui/                  # Lower-level UI utilities
    ├── divider.tsx
    ├── loading-spinner.tsx
    ├── version-watermark.tsx
    ├── animated-wrappers/  # Reanimated animations (scaleInOut.tsx)
    ├── fallbacks/          # empty-state.tsx, query-loading-state.tsx
    ├── form-fields/        # date-picker-input, time-picker-input, media-picker, text-area
    ├── layout/
    │   ├── bottom-tabs/    # Custom bottom tab bar with sync button
    │   └── header/         # Custom screen header with account section
    └── overlay/            # Backdrop and overlay components
```

### `src/app-screens-content/` — Screen Logic Extraction

Screen-specific logic extracted from route files (keeps routes thin):
```
src/app-screens-content/
└── auth/
    └── login/
        └── login-schema.tsx   # Zod form validation schema for login
```

### `src/constants/` — App Constants

```
src/constants/
└── theme.ts    # Colors: black, white, gray, grayDark, grayLighter, green (#365D3D), orange (#E67F2D)
```

### `src/hooks/` — Custom Hooks

Currently empty — placeholder for future custom hooks.

### `src/utils/` — Utility Functions

```
src/utils/
├── credentials-utils.ts   # Save/retrieve/clear credentials (SecureStore)
├── jotai-storage.ts       # Custom Jotai storage adapters for SecureStore + AsyncStorage
```

### `src/` — Root-level Source Files

| File | Purpose |
|---|---|
| `env-config.ts` | Reads `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL_DEV` env vars |
| `query-provider.tsx` | TanStack QueryClientProvider + Jotai hydration setup |
| `storage-keys.ts` | Constants for AsyncStorage/SecureStore key names |

---

## Other Root Folders

| Folder | Purpose |
|---|---|
| `scripts/` | `increment-version.js` (bumps build-version.json), `move-apk-to-project.js` (copies built APK) |
| `fonts/` | Fira Sans font files (full weight range) |
| `assets/android-icons/` | Android adaptive icons |
| `android/` | Native Android project (Gradle-based, auto-generated by Expo prebuild) |
| `docs/` | Project documentation |

---

## Key Conventions

| Convention | Detail |
|---|---|
| **File naming** | kebab-case for all files (`app-button.tsx`, `auth.atoms.ts`, `token-refresh.ts`) |
| **Path alias** | `@/*` → project root (e.g., `@/src/api/...`) |
| **Service pattern** | Object literal with async methods in `src/api/endpoints/` |
| **Atom naming** | Suffixed with `Atom` (`userAtom`, `tokenAtom`, `isAuthenticatedAtom`) |
| **Forms** | `react-hook-form` + `@hookform/resolvers` + `zod` (v4) |
| **Data fetching** | TanStack Query via Jotai atoms (`atomWithQuery`, `atomWithMutation`) — not direct hooks |
| **Offline support** | `bulk-sync.ts` endpoint + Realm database for local persistence |
| **Formatting** | Biome: tabs, 100 chars, double quotes, semicolons |
| **TypeScript** | Strict mode, `type` imports preferred |

## Key Dependencies

| Category | Libraries |
|---|---|
| Navigation | expo-router, react-native-safe-area-context |
| State | jotai, jotai-tanstack-query, @tanstack/react-query |
| Forms | react-hook-form, @hookform/resolvers, zod, @tanstack/react-form |
| API | axios |
| Storage | expo-secure-store, @react-native-async-storage/async-storage |
| Database | realm, @realm/react |
| UI | react-native-reanimated, expo-blur, expo-linear-gradient, react-native-svg, expo-image |
| Media | expo-image-picker, expo-image-manipulator, react-native-signature-canvas |
| Toasts | toastify-react-native |
| Linting | @biomejs/biome |
