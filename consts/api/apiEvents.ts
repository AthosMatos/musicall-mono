/**
 * Shared sync-state values for the client sync indicator (RF-34).
 *
 * Media uploads use presigned direct-to-storage URLs (see ADR-0002), not
 * Socket.io chunking, so the previous upload/download event protocol was
 * removed. Sync state is derived client-side from TanStack Query mutation
 * status; these are the canonical values both web and mobile render.
 */
export const syncState = {
    synced: 'synced',
    pending: 'pending',
    error: 'error',
} as const;

export type SyncState = (typeof syncState)[keyof typeof syncState];
