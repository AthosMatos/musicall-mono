import { useMemo } from "react";
import { useQuery } from "./realm";
import type { Collection } from "./schemas";
import { MediaAsset } from "./schemas";

/**
 * Resolves a collection's cover picture.
 *
 * The cover is whichever image was added first, unless one has been picked
 * explicitly (`coverMediaId`). Deleting the chosen cover clears that field —
 * see `deleteMediaAsset` — so the rule falls back to "the oldest one" again.
 *
 * This is a single query returning a lookup function rather than a hook called
 * per row, so list screens can stay a plain `.map()`.
 */
export function useCollectionCovers(): (collection: Collection) => string | null {
  const images = useQuery({
    type: MediaAsset,
    query: (assets) => assets.filtered("type == 'image' SORT(createdAt ASC)"),
  });

  return useMemo(() => {
    const byAssetId = new Map<string, string>();
    const oldestPerCollection = new Map<string, string>();

    for (const image of images) {
      byAssetId.set(image.id, image.uri);
      if (image.collectionId && !oldestPerCollection.has(image.collectionId)) {
        oldestPerCollection.set(image.collectionId, image.uri);
      }
    }

    return (collection: Collection) => {
      if (collection.coverMediaId) {
        const chosen = byAssetId.get(collection.coverMediaId);
        if (chosen) return chosen;
      }
      return oldestPerCollection.get(collection.id) ?? null;
    };
  }, [images]);
}

/** Every picture filed under a collection, oldest first — the cover leads. */
export function useCollectionImages(collectionId: string) {
  return useQuery(
    {
      type: MediaAsset,
      query: (assets) =>
        assets.filtered(
          "collectionId == $0 AND type == 'image' SORT(createdAt ASC)",
          collectionId
        ),
    },
    [collectionId]
  );
}
