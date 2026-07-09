// Shared domain core for musicall (web + mobile + api). See CONTEXT.md.

// Domain logic
export * from './domain/lyrics.js';
export * from './domain/status.js';

// Schemas + inferred types (the API contract)
export * from './schemas/auth.js';
export * from './schemas/collection.js';
export * from './schemas/common.js';
export * from './schemas/content.js';
export * from './schemas/media.js';
export * from './schemas/song.js';
export * from './schemas/tag.js';

// NOTE: the API client (ApiClient, ApiError, configureApiClient, apiRequest,
// uploadToPresignedUrl) is intentionally NOT re-exported here. It lives solely
// under `@monorepo/core/api` so there is exactly ONE module instance holding the
// registered client and the ApiError class. Re-exporting it from this root entry
// makes bunchee inline a *second* copy into the `.` bundle, giving each entry its
// own `configuredClient` (registration silently no-ops for the hooks) and its own
// `ApiError` (so `instanceof` checks fail across entries). Import client bits from
// `@monorepo/core/api`.
