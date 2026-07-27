# `apps/mobile` — Architecture Reference

Technical documentation of the musicall mobile app's structure and conventions.

The app is **local-first and offline-only**: everything the user creates lives in a Realm database
on the device, plus media files in the app's document directory. There is no account, no login and
no network calls — the API client that used to back these screens (`@monorepo/core/api`) is no
longer imported here. `@monorepo/core` is still used, but only for the platform-agnostic domain
bits (status enums, `parseLyricSections`).

See `CONTEXT.md` at the repo root for the domain glossary the schema mirrors.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed) + Expo Router (file-based routing), React 19.2, RN 0.83 |
| Language | TypeScript, strict mode |
| Persistence | **Realm** (`realm` + `@realm/react`) — a single local database file, `musicall.realm` |
| Media files | `expo-file-system` — audio/images copied into the document directory |
| Client state | Jotai (only for cross-cutting UI state, e.g. `inPrimaryPageAtom`) |
| i18n | **i18next + react-i18next**, seeded from the device locale via **expo-localization** |
| Styling | NativeWind (Tailwind for RN) + a small hand-rolled component kit |
| Icons | lucide-react-native, `@expo/vector-icons` (Ionicons) |
| Audio | expo-av (recording + playback), expo-document-picker (import) |
| Toasts | toastify-react-native |
| Misc UX | react-native-reanimated, react-native-keyboard-controller, native blur on modals |

There is deliberately **no server-state library**. Realm results returned by `useQuery`/`useObject`
are *live*: they re-render on write, so there is no cache to invalidate and no query keys to manage.

## Path aliases (`tsconfig.json`)

```
@/*        -> ./src/*
@/assets/* -> ./assets/*
@root/*    -> ./*
```

## Folder structure

```
src/
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # RealmProvider + Jotai + Keyboard; onboarding vs app guard
│   ├── index.tsx               # Redirect based on whether onboarding is done
│   ├── (onboarding)/           # First-run flow (no profile row yet)
│   │   ├── index.tsx           #   language picker — two flags, untranslated copy
│   │   └── profile.tsx         #   name (required) + photo (optional)
│   └── (app)/                  # Everything after onboarding
│       ├── _layout.tsx         #   Header + DefaultStack + BottomTabs
│       ├── (tabs)/             #   home, songs, albums (route grouping only —
│       │                       #     the visible bar is components/layout/bottom-tabs)
│       ├── song/[id]/          #   detail (index.tsx) + lyric editor (edit.tsx)
│       ├── album/[id].tsx
│       ├── capture.tsx         #   record an idea → creates a draft song
│       ├── profile.tsx         #   name, photo, language, trash
│       └── trash.tsx           #   restore / purge soft-deleted songs & collections
│
├── db/                         # The data layer
│   ├── schemas.ts              #   Realm.Object classes (Song, LyricVersion, ChordChart,
│   │                           #     Tablature, MediaAsset, Collection, UserProfile)
│   ├── realm.ts                #   createRealmContext → RealmProvider/useRealm/useQuery/useObject
│   ├── repository.ts           #   every write, one transaction per function; shared predicates
│   ├── profile.ts              #   useProfile() + hasOnboarded()
│   └── index.ts                #   barrel — screens import from "@/db"
│
├── media/                      # Local media handling
│   ├── files.ts                #   copy into the document dir, unlink, mime/extension helpers
│   ├── audio.ts                #   duration probe, import to song, useAudioImport()
│   └── images.ts               #   gallery picker, avatar, useImageImport()
│
├── i18n/
│   ├── index.ts                # init, deviceLanguage(), changeLanguage(), currentLocaleTag()
│   └── locales/{pt,en}.json    # one flat-ish tree, keys namespaced by leading segment
│
├── hooks/useAudioPlayback.ts   # expo-av playback off a local file URI
├── components/
│   ├── flags.tsx               # SVG Brazil / USA flags used as the language buttons
│   ├── ui/                     # AppText, AppModal, AppDropDown, MonoEditorModal, ui.tsx (CoverArt,
│   │                           #   StatusDot, StatusPill, Waveform, PlayButton, …), form/
│   ├── layout/                 # header/, bottom-tabs/
│   └── utility/                # defaultStack, LazyLoad
├── lib/model.ts                # presentation helpers (covers, labels, dates) — take a `TFunction`
├── atoms/                      # jotaiStore + inPrimaryPageAtom
└── theme.ts                    # colors, fonts, cover gradients, status dot colors
```

## Key patterns

### 1. Routing & the onboarding gate
`app/_layout.tsx` wraps everything in `JotaiProvider > RealmProvider > KeyboardProvider`, then a
`RootNavigator` uses `Stack.Protected guard={onboarded}` to switch between `(onboarding)` and
`(app)` entirely in the file-system router. `onboarded` is `hasOnboarded(useProfile())` — the
profile row exists *and* has a non-empty name.

That two-part condition matters: the language screen creates the row (so the choice is persisted
immediately) with an empty name, and the name screen fills it in. Writing the name is what flips
the guard. `RealmProvider` renders a `fallback` while the database file opens, and the splash
screen is hidden once `RootNavigator` mounts.

### 2. Data access: `useQuery`/`useObject` to read, `repository.ts` to write
- **Reads** happen in the screen: `useQuery({ type: Song, query: activeSongs })`,
  `useObject(Collection, id)`. Results are live, so a write anywhere re-renders every screen
  showing that data. Predicates shared by more than one screen (`NOT_TRASHED`, `TRASHED`,
  `activeSongs`, `activeCollections`) live in `db/repository.ts`.
- **Writes** never happen inline. Every mutation is a function in `db/repository.ts` taking the
  open `Realm` as its first argument and wrapping its changes in exactly one `realm.write(…)`.
  This keeps invariants (bumping `updatedAt`, demoting the previous primary lyric version,
  dropping a trashed song out of every collection) in one place instead of at each call site.

### 3. Ids and the trash
Primary keys are called `id` (not `_id`) and hold hex UUID strings, because they double as
expo-router path params (`/song/${song.id}`). Songs and collections are **soft-deleted**
(`deletedAt`) and reachable from `profile → trash`, which is the only place `purgeSong` /
`purgeCollection` run. Purging returns the file URIs of the deleted `MediaAsset`s so the caller
can unlink them — the repository never touches the filesystem itself.

### 4. Media
Audio and images always land in the app's **document** directory (`media/files.ts`), never the
cache, so the OS cannot reclaim them. A recording's temp file, a picked document and a gallery
image all go through the same `storeFile()` path, named after the `MediaAsset` id. `MediaAsset.uri`
is therefore a stable `file://` path that `expo-av` and `expo-image` read directly — there is
nothing to sign or download.

### 5. i18n
`src/i18n/index.ts` boots i18next with the **device** locale (via `expo-localization`) so the very
first frame is sensible; the *stored* choice on `UserProfile.language` then wins, pushed into
i18next by an effect in `RootNavigator`. Both languages can be switched at runtime from
`profile.tsx`.

Presentation helpers in `lib/model.ts` (`songStatusLabel`, `songMeta`, `collectionTypeLabel`, …)
take the `TFunction` from the calling component's `useTranslation()` rather than importing the
i18next singleton, so they re-render when the language changes. Dates go through `Intl` with
`currentLocaleTag()` instead of hardcoded month names.

The **language screen is intentionally not translated**: the user cannot read one of the two
paragraphs yet, so both are shown at once and the flags carry the meaning. The flags are drawn
with `react-native-svg` (`components/flags.tsx`) rather than emoji, which several Android system
fonts do not ship.

### 6. Modals & the design system
`AppModal` (native `Modal` + blur overlay + fade) is the base; feature modals wrap it and own their
own visibility state. `MonoEditorModal` is the shared monospaced editor behind the chord chart and
tablature tabs, where column alignment is the point. Colors come from `theme.ts`, mirrored into
`theme/colors.config.js` so `tailwind.config.js` extends the same palette.

### 7. Bottom tabs & header
`BottomTabs` is custom (the native `Tabs` bar is hidden with `tabBarStyle: { display: "none" }` and
used only for route grouping/animation). It reads `usePathname()` against a declarative `tabs`
config and writes `inPrimaryPageAtom`, which the header reads to decide whether to show a back
button — that is the one piece of state still on Jotai.
