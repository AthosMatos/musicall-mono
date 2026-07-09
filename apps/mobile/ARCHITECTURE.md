# `apps/mobile-new` — Architecture Reference

Technical documentation of this app's structure and conventions, written to serve as the
**reference architecture** for refactoring `apps/mobile` (the musicall mobile app). This app
(codename "kinebotAEP") is a separate, unrelated product (ergonomic analysis tool) — it's here
purely as a pattern library, not as code to merge directly. When refactoring `apps/mobile`, port
the *patterns* below, not the domain code (analyses/auth screens etc. are kinebot-specific).

See also `README.md` in this folder for the product-level write-up (in Portuguese) this doc
complements with an implementation-focused, English technical breakdown.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed) + Expo Router (file-based routing), React 19.2, RN 0.83 |
| Language | TypeScript, strict mode |
| Server state | TanStack Query, wired through **jotai-tanstack-query** (`atomWithQuery`, `atomWithMutation`, `atomWithInfiniteQuery`) |
| Client state | Jotai atoms (including persisted atoms via `atomWithStorage`) |
| HTTP | Axios single instance with request/response interceptors |
| Forms | React Hook Form + Zod (`@hookform/resolvers/zod`) |
| Styling | NativeWind (Tailwind for RN) + a small hand-rolled component kit (not full Gluestack usage despite the dependency) |
| Icons | lucide-react-native |
| Persistence | AsyncStorage (general data) + Expo SecureStore (auth token) |
| Toasts | toastify-react-native, wrapped in domain-specific toast helpers |
| Misc UX | react-native-reanimated, react-native-keyboard-controller, native blur on modals |

Compare to current `apps/mobile`: Expo SDK 52 / RN 0.76 / React 18, routes live at `app/` (not
`src/app/`), state is plain TanStack Query with no Jotai, no Zod/RHF, no path aliases, and it
pulls shared code from `@monorepo/core`. Any refactor needs to decide whether to adopt Jotai +
jotai-tanstack-query or keep TanStack Query alone — that's an open decision, not dictated by this
doc.

## Path aliases (`tsconfig.json`)

```
@/*      -> ./src/*
@/assets/* -> ./assets/*
@root/*  -> ./*
```

## Folder structure

```
src/
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # Root layout: providers + auth-gated Stack.Protected
│   ├── index.tsx                # Redirect/entry route
│   ├── (auth)/                 # Public flow (login, forgot password)
│   │   └── _layout.tsx
│   └── (protected)/             # Authenticated flow (guarded by Stack.Protected)
│       ├── _layout.tsx          # Renders Header + DefaultStack + BottomTabs
│       ├── (tabs)/               # Tab bar routes (home, analyses, config, user)
│       │   └── <feature>/        # Each tab feature is a folder, colocating:
│       │       ├── index.tsx        #   screen
│       │       ├── _layout.tsx       #   optional nested stack
│       │       ├── atoms.ts          #   local jotai atoms (filters, modal visibility)
│       │       ├── context.tsx       #   screen-scoped React context + data hook
│       │       ├── components/       #   presentational pieces used only here
│       │       ├── sections/         #   larger composed blocks of the screen
│       │       ├── modals/           #   modals opened from this screen
│       │       └── utils.ts
│       └── <domain>/            # Non-tab feature stacks (e.g. analyse detail/create/edit)
│           ├── [id]/               # Dynamic route folder: index, context, sections, modals
│           ├── create.tsx
│           ├── edit/[id].tsx
│           └── components/          # Shared between create/edit (e.g. one form component)
│
├── api/                        # Data layer
│   ├── axios.config.ts          # Axios instance + auth header + 401 interceptor
│   ├── endpoints/                # One file per resource: typed service object (get/post/put/...)
│   └── schemas/                  # Zod schemas — both form validation and inferred TS types
│
├── atoms/                      # Global Jotai state
│   ├── store.ts                  # `createStore()` — passed to <Provider store={jotaiStore}>
│   ├── pages.ts                  # Cross-cutting UI atoms (e.g. inPrimaryPageAtom)
│   ├── auth/                     # token.ts, user.ts — persisted atoms (SecureStore/AsyncStorage)
│   └── api/<domain>/             # query.ts, mutations.ts, invalidate.ts per resource
│
├── auth/                       # auth.provider.tsx (context+hook), use-auth-states.ts
├── components/
│   ├── app-defaults/              # Base design-system primitives (AppButton, AppText, AppSelect,
│   │                               #   AppModal, AppLoad, AppGradientView)
│   ├── form/                      # AppForm (bound inputs) + inputs/ (text, date, switch, checkbox,
│   │                               #   currency) + inputs/styled.tsx (shared styled primitives)
│   ├── layout/                    # header/, bottom-tabs/ (index, tabs config, per-tab Tab component)
│   ├── login/                     # login-layout.tsx
│   ├── defaultStack.tsx           # Shared <Stack> screenOptions used by protected layout
│   └── LazyLoad.tsx                # loading-state wrapper
├── contexts/
│   └── form.context.tsx           # AppFormProvider/useAppFormContext — wraps react-hook-form
├── constants/
│   ├── colors.ts                  # appColors (TS, used at runtime)
│   └── colors.config.js           # same palette re-exported for tailwind.config.js
├── toasts/                      # One file per domain: `{domain}Toast.error.*` / `.success.*`
├── utils/                       # jotai-storage.utils (AsyncStorage/SecureStore adapters), date,
│                                  #   currency, sleep
├── mock/                        # Mock atoms/data (this app has no real backend for auth)
├── env-config.ts                # Typed env reader (`ENV`, `getApiBaseUrl()`)
├── storage-keys.ts
└── query-provider.tsx            # QueryClient + QueryClientProvider + jotai hydration bridge
```

## Key patterns

### 1. Routing & auth gating
`app/_layout.tsx` wraps everything in `JotaiProvider(store) > QueryProvider > AuthProvider >
KeyboardProvider`, then renders a `RootNavigator` that uses `Stack.Protected guard={isLoggedIn}`
to switch between the `(protected)` and `(auth)` route groups entirely in the file-system router
— no manual redirect logic needed. `SplashScreen.preventAutoHideAsync()` is called at module
scope in `auth.provider.tsx`, and hidden once the provider has mounted and restored session state.

### 2. Layered API access: service → atom → screen
- **`api/endpoints/*.endpoints.ts`**: plain async functions calling the shared `api` (axios)
  instance, typed request/response, catching errors to fire a toast and rethrow.
- **`atoms/api/<domain>/query.ts`**: wraps each read in `atomWithQuery` / `atomWithInfiniteQuery`
  (factory functions taking params, since query atoms need fresh `queryKey`s per call site).
- **`atoms/api/<domain>/mutations.ts`**: wraps writes in `atomWithMutation`, handling
  `onSuccess` cache invalidation and success toasts centrally (so screens don't repeat this).
- Screens/contexts just do `useAtomValue(getXQueryAtom(params))` or
  `useAtomValue(postXAtom)` and get `{ data, isLoading, mutateAsync, isPending, error }` —
  no manual query-key management or try/catch for the toast path.

### 2b. Auth & token handling
- `authTokenAtom` / `userAtom` are `atomWithStorage`, backed by SecureStore (token) and
  AsyncStorage (user), via adapters in `utils/jotai-storage.utils.ts` that JSON-encode and
  null-safe the values.
- `axios.config.ts` reads the token directly from storage (not from the atom) in its request
  interceptor, and exposes `setLogoutCallback` so `AuthProvider` can register a logout handler
  the interceptor invokes on a 401 response.
- Query client is cleared (`removeQueries()` + `clear()`) on sign-in and again on sign-out, so no
  stale per-user data survives an account switch.

### 3. Screen-local state colocation
Every non-trivial screen gets its own `atoms.ts` (jotai atoms scoped to that screen — modal
visibility, filter params) and often a `context.tsx` that wraps a query atom and exposes a small,
typed hook (`useAnalyseListContext`, `useAnalyseDataContext`). This keeps data-fetching out of
leaf components: `sections/list.tsx` just calls `useAnalyseListContext()` and renders. The pattern
repeats for infinite-scroll lists (context owns `fetchNextPage`/`hasNextPage`, `FlatList`'s
`onEndReached` calls it).

### 4. Forms
- Zod schema lives in `api/schemas/*.schema.ts` and is the single source of truth for both
  validation and the inferred TS input type.
- `contexts/form.context.tsx` provides `AppFormProvider` (wraps `useForm` with `zodResolver`,
  `mode: "onChange"`) and `useAppFormContext()`.
- `components/form/index.tsx` (`AppForm`) is a render-prop component that hands back
  pre-bound `Input`/`DateInput`/`Select`/`CurrencyInput`/`CheckBox`/`Switch` components so screen
  code never touches `Controller` directly.
- A single form component (e.g. `AnalysesForm`) is shared between create and edit screens; the
  parent screen supplies `defaultValues`/`onSubmit`, only differing in which mutation atom it calls.

### 5. Modals
`AppModal` (native `Modal` + native blur overlay + fade) is the base; feature modals wrap it and
manage their own visibility atom (e.g. `editProfileModalVisibleAtom`) colocated in the owning
screen's `atoms.ts`. Complex modals (the analysis result editor) work on a local draft state that
is only committed back to the parent form on confirm, discarded on cancel.

### 6. Design-system primitives (`components/app-defaults/`)
Small, prop-driven wrappers instead of a heavy UI kit: `AppText` (font + semantic text colors),
`AppButton` (variant map: default/outline/disabled/transparent/delete, icon-only mode, loading
state), `AppSelect`, `AppModal`, `AppLoad`, `AppGradientView`. Colors come from
`constants/colors.ts` (`appColors`), mirrored into `constants/colors.config.js` so
`tailwind.config.js` can extend the same palette — one source of truth consumed from both a JS
(Tailwind) and TS (runtime) context.

### 7. Toasts
One file per domain in `toasts/`, exporting `{domain}Toast.error.<action>()` and
`.success.<action>()` functions that call `Toast.show(...)`. Error toasts are triggered inside
the `api/endpoints` service layer itself (not in screens), so every call site automatically gets
consistent error UX without repeating try/catch.

### 8. Bottom tabs & header
Custom `BottomTabs` (not the native `Tabs` tab bar UI — `Tabs` is used only for route
grouping/animation, with `tabBarStyle: { display: "none" }`) reads `usePathname()` to determine
the active tab from a declarative `tabs` config array (`path` + `icon` renderer), and writes an
`inPrimaryPageAtom` boolean other components (like the header's back button) read to decide
whether to show a back button.

## Notable technical decisions worth carrying over
- Zod schemas double as form types (`z.infer`) — avoids maintaining parallel interfaces.
- Mutation atoms centralize cache invalidation and toast side effects; screens stay declarative.
- Query-atom factories (functions returning `atomWithQuery(...)`) are used instead of static atoms
  wherever the query needs runtime params (id, filters) — plain module-level atoms only work for
  parameterless queries.
- Persisted atoms use adapter objects implementing Jotai's `AsyncStringStorage`/`AsyncStorage`
  interface, so swapping AsyncStorage vs SecureStore per-atom is a one-line change.
- `env-config.ts` centralizes `process.env.EXPO_PUBLIC_*` access behind a typed `ENV` object and
  `getApiBaseUrl()` — nothing reads `process.env` directly elsewhere.
