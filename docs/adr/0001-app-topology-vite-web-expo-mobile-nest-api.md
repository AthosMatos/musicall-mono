# App topology: Vite web + Expo mobile + NestJS API

The repo shipped with two web frontends (a Next.js `site` and a Vite `web` SPA) and no mobile app, while the product requires both web and mobile. We removed the Next.js `site`, kept the Vite SPA as the single web product surface, and added an Expo (React Native) `mobile` app, all served by the existing NestJS API. We chose this over keeping Next.js (SSR/SEO) because the product is a private, authenticated tool rather than a public content site, and because a Vite SPA + Expo mobile pair maximises shared TypeScript logic (types, validation, API client) without committing to a cross-platform UI layer.

## Consequences

- Shared, non-UI code lives in `packages/core` (types, Zod schemas, API client, domain logic); UI is built separately per platform.
- We give up server-side rendering and built-in SEO. Acceptable for an authenticated app; revisit if a public marketing/landing surface is needed later.
