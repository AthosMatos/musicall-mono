// Shared domain core for Songbook (web + mobile + api). See CONTEXT.md.

// Domain logic
export * from './domain/status.js';
export * from './domain/lyrics.js';

// Schemas + inferred types (the API contract)
export * from './schemas/common.js';
export * from './schemas/auth.js';
export * from './schemas/song.js';
export * from './schemas/content.js';
export * from './schemas/media.js';
export * from './schemas/collection.js';
export * from './schemas/tag.js';

// API client
export * from './api/client.js';
export * from './api/upload.js';
