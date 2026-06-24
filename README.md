# Songbook

A full-stack monorepo for **Songbook**, a musician's "second brain" for storing, developing, and organizing songs (lyrics, chords, tabs, audio, images) across web and mobile. Built with NestJS (API), Vite + React (web), and Expo (mobile), with shared packages and centralized tooling. See [CONTEXT.md](CONTEXT.md) for the domain glossary and [docs/adr/](docs/adr/) for architecture decisions.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

This monorepo contains three complementary applications and several shared packages managed with **pnpm workspaces** and **Turbo**:

### Applications

- **API** ([`apps/api`](apps/api)) - NestJS backend server (Prisma + PostgreSQL, S3-compatible object storage)
- **Web** ([`apps/web`](apps/web)) - Vite-powered React single-page application (the Songbook web client)
- **Mobile** ([`apps/mobile`](apps/mobile)) - Expo (React Native) application (the Songbook mobile client)

### Shared Packages

- **Logger** ([`packages/logger`](packages/logger)) - Shared logging utility used across apps
- **UI** ([`packages/ui`](packages/ui)) - Reusable React components (counter-button, link)
- **Config: ESLint** ([`packages/config-eslint`](packages/config-eslint)) - Centralized ESLint configuration
- **Config: TypeScript** ([`packages/config-typescript`](packages/config-typescript)) - Centralized TypeScript configuration

- **Core** ([`packages/core`](packages/core)) - Shared domain types, Zod schemas, fetch-based API client, and pure domain logic used by web and mobile

### Constants

- **API Constants** ([`consts/api`](consts/api)) - Shared API constants (e.g. sync-state values)

## Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v8.15.6 (package manager)
- **Turbo**: v2.9.14 (monorepo orchestration)

Verify your setup:

```bash
node --version    # Should be >= 18
pnpm --version    # Should be >= 8.15.6
```

## Installation

1. **Clone the repository** (if not already done):

```bash
git clone <repository-url>
cd monorepo-next-nest-vite
```

2. **Install dependencies**:

```bash
pnpm install
```

This command will:
- Install all root-level dependencies
- Install dependencies for all apps and packages
- Link packages within the monorepo
- Create necessary symlinks for workspace packages

## Quick Start

### Start all applications in development mode:

```bash
pnpm dev
```

This runs the dev task for all apps with their default configurations:
- **API**: Runs on default NestJS port (usually 3000)
- **Web**: Runs on Vite's default port (usually 5173)
- **Mobile**: Starts the Expo dev server (Metro)

> Local infrastructure (PostgreSQL + MinIO) runs via Docker — see [Development](#development).

### Or start individual applications:

```bash
# Start only the API
pnpm dev --filter api

# Start only the Web app
pnpm dev --filter web

# Start only the Mobile app
pnpm dev --filter mobile
```

## Available Scripts

All commands are run from the root directory and orchestrated by Turbo for caching and parallel execution.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode with hot reload |
| `pnpm build` | Build all apps and packages for production |
| `pnpm lint` | Run ESLint across all apps and packages |
| `pnpm format` | Format all TypeScript, TSX, and Markdown files with Prettier |
| `pnpm test` | Run tests across all apps and packages |
| `pnpm check-types` | Type-check all TypeScript files |
| `pnpm clean` | Clean all build artifacts and caches |

### App-Specific Scripts

**API** (`apps/api`):
- `dev` - Start in watch mode
- `start` - Run production build
- `start:prod` - Run built distribution
- `test` / `test:watch` / `test:cov` / `test:e2e` - Various Jest testing modes
- `lint` - Run and fix ESLint issues
- `format` - Format with Prettier

**Web** (`apps/web`):
- `dev` - Start Vite dev server
- `build` - Build for production
- `preview` - Preview production build locally
- `lint` / `lint:fix` - Run/fix ESLint
- `format` / `format:check` - Format with Prettier

**Mobile** (`apps/mobile`):
- `dev` - Start the Expo dev server (Metro)
- `android` / `ios` - Run on a device/simulator
- `lint` - Run ESLint

## Project Structure

```
monorepo-next-nest-vite/
├── apps/                          # Application packages
│   ├── api/                        # NestJS backend server
│   │   ├── prisma/                 # Prisma schema + migrations
│   │   ├── src/
│   │   │   └── main.ts             # Application entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   ├── web/                        # Vite React SPA (web client)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── mobile/                     # Expo React Native app (mobile client)
│       ├── app/
│       ├── package.json
│       └── app.json
├── packages/                       # Shared packages
│   ├── core/                       # Shared domain types, Zod schemas, API client, domain logic
│   ├── config-eslint/              # ESLint configuration (extends to all apps)
│   ├── config-typescript/          # TypeScript configuration (extends to all apps)
│   ├── logger/                     # Logging utility (@monorepo/logger)
│   ├── ui/                         # Web UI components (@monorepo/ui)
│   └── scripts/                    # Utility scripts (generate-exports.mjs)
├── consts/                         # Shared constants
│   └── api/
│       └── apiEvents.ts            # Shared API constants (sync-state values)
├── docs/adr/                       # Architecture Decision Records
├── CONTEXT.md                      # Domain glossary
├── docker-compose.yml              # Local PostgreSQL + MinIO
├── package.json                    # Root package configuration
├── pnpm-workspace.yaml             # pnpm workspace configuration
├── turbo.json                      # Turbo monorepo configuration
└── README.md                       # This file
```

## Architecture

### Monorepo Strategy

This project uses **pnpm workspaces** for dependency management and **Turbo** for task orchestration:

- **pnpm workspaces**: Efficient dependency hoisting and workspace package linking
- **Turbo**: Intelligent task caching, parallel execution, and dependency management

### Task Dependencies

Turbo defines task dependencies in [`turbo.json`](turbo.json):

```
build
├── requires: ^build (dependencies must build first)
├── outputs: dist/, .next/, .vercel/, build/
└── caches results for next run

lint
├── requires: ^build and ^lint
└── runs after building and linting dependencies

check-types
├── requires: ^build and ^check-types
└── enforces type safety across monorepo

dev
├── requires: ^build
├── persistent: true
└── no caching (real-time development)

test
└── no dependencies, runs independently
```

### Application Integration

```
┌─────────────────┐        ┌─────────────────┐
│   Web (Vite)    │        │ Mobile (Expo)   │
│   React SPA     │        │  React Native   │
│   Port ~5173    │        │  Metro          │
└────────┬────────┘        └────────┬────────┘
         │   REST (TanStack Query)   │
         └─────────────┬─────────────┘
                       ▼
              ┌─────────────────┐        ┌──────────────────┐
              │  API (NestJS)   │───────►│   PostgreSQL     │
              │  Prisma         │        │   (metadata)     │
              │  Port ~3000     │───────►│  Object storage  │
              └─────────────────┘        │  (R2 / MinIO)    │
                       ▲                  └──────────────────┘
                       │ presigned URLs (direct upload/playback)
         ┌─────────────┴─────────────┐
         │     packages/core         │
         │  types · Zod · API client │
         │  · domain logic           │
         └───────────────────────────┘
```

## Development

### Local Infrastructure

The API needs PostgreSQL and an S3-compatible object store. Both run locally via Docker:

```bash
docker-compose up -d          # start PostgreSQL + MinIO
cp apps/api/.env.example apps/api/.env
pnpm --filter api exec prisma migrate dev   # apply the schema
```

MinIO console is at http://localhost:9001 (see `docker-compose.yml` for credentials). In production, object storage is Cloudflare R2 (same S3 API).

### Running the Development Environment

Start all apps simultaneously (recommended for full-stack development):

```bash
pnpm dev
```

Monitor Turbo's parallel execution in the terminal UI.

### Working on Individual Apps

To focus on a specific app:

```bash
# API development
cd apps/api
pnpm dev

# Web development
cd apps/web
pnpm dev

# Mobile development
cd apps/mobile
pnpm dev
```

From the root, you can also:

```bash
pnpm dev --filter=api
pnpm build --filter=web
pnpm lint --filter=mobile
```

### Using Shared Packages

All apps have access to shared packages via workspace imports:

```typescript
// In any app, import from shared packages:
import { log } from "@monorepo/logger";
import { CounterButton } from "@monorepo/ui/counter-button";
import { syncState } from "@constants/api/apiEvents";
// Shared domain types, schemas, API client:
import { songSchema, type Song } from "@monorepo/core";
```

The packages are automatically linked during `pnpm install` and built before apps build.

### Code Style and Formatting

Before committing:

```bash
pnpm format       # Auto-format all files
pnpm lint         # Check and fix linting issues
pnpm check-types  # Verify TypeScript compilation
```

These commands run across the entire monorepo.

## Building

### Build for Production

Build all apps and packages:

```bash
pnpm build
```

This will:
1. Build all packages (core, logger, ui, configs)
2. Build all applications (api, web) with task dependencies respected
3. Output production artifacts:
   - API: `dist/`
   - Web: `dist/`

### Build Specific Apps

```bash
pnpm build --filter=api
pnpm build --filter=web
```

### Running Production Builds

**API**:
```bash
cd apps/api
pnpm start:prod
```

**Web**:
```bash
cd apps/web
pnpm preview
```

**Mobile** is built/distributed via Expo (EAS Build), not `pnpm build`.

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
cd apps/api
pnpm test:watch
```

### Generate Coverage Reports

```bash
cd apps/api
pnpm test:cov
```

## Contributing

### Before Submitting Changes

1. **Format code**:
   ```bash
   pnpm format
   ```

2. **Lint and fix issues**:
   ```bash
   pnpm lint
   ```

3. **Type-check**:
   ```bash
   pnpm check-types
   ```

4. **Run tests** (if applicable):
   ```bash
   pnpm test
   ```

### Commit Guidelines

- Use clear, descriptive commit messages
- Format your code before committing (run `pnpm format`)
- Ensure no lint errors (run `pnpm lint`)
- Include tests for new features

### Adding New Packages

To create a new shared package:

1. Create a directory in `packages/`:
   ```bash
   mkdir packages/my-package
   ```

2. Add a `package.json` with workspace naming convention:
   ```json
   {
     "name": "@monorepo/my-package",
     "version": "0.0.0",
     "private": true
   }
   ```

3. Update `pnpm-workspace.yaml` if using a new directory pattern

4. Run `pnpm install` to link the new package

### Adding New Apps

To add a new application:

1. Create in `apps/`:
   ```bash
   mkdir apps/my-app
   ```

2. Initialize with framework tooling (e.g., `pnpm create next-app`, `npm init vite`, `nest new`)

3. Ensure `package.json` includes required scripts: `dev`, `build`, `lint`

4. Configure to use shared configs and packages

5. Run `pnpm install` to register the new app

## Troubleshooting

### Dependencies not installing

```bash
# Clear cache and reinstall
pnpm install --force
```

### Build failures

```bash
# Clean all build artifacts and try again
pnpm clean
pnpm build
```

### Type errors in IDE

```bash
# Regenerate TypeScript types
pnpm check-types
```

### Monorepo linking issues

```bash
# Rebuild workspace links
pnpm install --shamefully-hoist
```

## License

UNLICENSED

## Support

For questions or issues, please refer to individual app READMEs in their respective directories.
