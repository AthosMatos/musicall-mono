/**
 * The app's Realm context. `RealmProvider` opens (and creates on first launch)
 * a single local database file; `useQuery`/`useObject` return *live* results,
 * so screens re-render on write without any cache invalidation.
 */
import { createRealmContext } from "@realm/react";
import { schemas } from "./schemas";

export const { RealmProvider, useRealm, useQuery, useObject } = createRealmContext({
  schema: schemas,
  schemaVersion: 1,
  path: "musicall.realm",
});

export * from "./schemas";
