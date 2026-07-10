import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { mediaGetUrlOptions } from "@monorepo/core/api";
import { collectionCover, type CollectionLike } from "../lib/model";
import { CoverArt } from "./primitives";

type CollectionWithCover = CollectionLike & { coverMediaId: string | null };

/**
 * Renders a collection's real cover image when it has a `coverMediaId`
 * (resolving the short-lived signed URL), falling back to the deterministic
 * placeholder gradient while loading or when no cover is set.
 */
export function CollectionCover({
  collection,
  className = "",
  children,
}: {
  collection: CollectionWithCover;
  className?: string;
  children?: ReactNode;
}) {
  const coverId = collection.coverMediaId;
  const urlQuery = useQuery({ ...mediaGetUrlOptions(coverId ?? ""), enabled: !!coverId });
  const url = coverId ? urlQuery.data?.url : undefined;

  if (url) {
    return (
      <div
        className={`bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${url})` }}
      >
        {children}
      </div>
    );
  }

  return (
    <CoverArt variant={collectionCover(collection)} className={className}>
      {children}
    </CoverArt>
  );
}
