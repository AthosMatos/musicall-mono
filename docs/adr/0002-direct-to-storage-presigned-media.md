# Direct-to-storage media via presigned URLs

The repo's `consts/api/apiEvents.ts` sketched a Socket.io chunked-upload protocol that would stream every audio byte through the NestJS server. We replaced it with presigned URLs: the client requests a short-lived signed URL from the API and uploads the binary **directly** to object storage; the API only ever stores metadata and the object key. Playback uses a presigned GET with HTTP range requests for streaming. We chose this because audio is the heaviest and most cost-sensitive part of the product, and proxying it through the server would add bandwidth cost, load, and complexity for no MVP benefit — the brief itself requires that binaries never pass through the database/server.

## Consequences

- The server cannot do inline stream processing (waveform generation, transcoding) during upload; if needed later, do it asynchronously after the object lands, or reintroduce a server-side path for those specific cases.
- The Socket.io upload/download events were removed from `consts/api/apiEvents.ts`.
