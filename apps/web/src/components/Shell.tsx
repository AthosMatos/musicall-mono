import { useQuery } from "@tanstack/react-query";
import { Disc3, Heart, Home, LogOut, Music2 } from "lucide-react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { collectionsSearchOptions } from "@monorepo/core/api";
import { useAuth } from "../lib/auth";
import { collectionTypeLabel } from "../lib/model";
import { MonoLabel } from "./primitives";

const collectionDots = ["#c25e44", "#cf9b3f", "#6f8a72", "#8a8276"];

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/songs", label: "Músicas", icon: Music2 },
  { to: "/albums", label: "Álbuns", icon: Disc3 },
  { to: "/favorites", label: "Favoritas", icon: Heart },
];

function navRowClass(active: boolean): string {
  return `flex items-center gap-[11px] rounded-[9px] px-[10px] py-[9px] text-sm no-underline ${
    active ? "bg-surface-active text-ink" : "text-meta hover:text-ink-2"
  }`;
}

export default function Shell() {
  const { id: activeCollectionId } = useParams();
  const { user, logout } = useAuth();
  const collectionsQuery = useQuery(collectionsSearchOptions({ pageSize: 20 }));
  const collections = collectionsQuery.data?.items ?? [];

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-[258px] shrink-0 flex-col border-r border-border bg-bg-deep px-5 py-[26px]">
        <NavLink to="/" className="flex items-center gap-[10px] px-[6px] pb-[22px] no-underline">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-accent font-mono font-bold text-on-accent">
            <Music2 size={16} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-[-0.01em] text-ink">Songbook</span>
        </NavLink>

        <nav className="flex flex-col gap-[2px]">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => navRowClass(isActive)}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {collections.length > 0 && (
          <>
            <MonoLabel className="px-2 pt-5 pb-[6px]">Coleções</MonoLabel>
            <nav className="flex flex-col gap-[2px]">
              {collections.map((c, i) => (
                <NavLink
                  key={c.id}
                  to={`/albums/${c.id}`}
                  className={navRowClass(c.id === activeCollectionId)}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ background: collectionDots[i % collectionDots.length] }}
                  />
                  <span className={`truncate ${c.id === activeCollectionId ? "" : "text-ink-2"}`}>
                    {c.type === "album" ? `${c.title} · ${collectionTypeLabel(c)}` : c.title}
                  </span>
                </NavLink>
              ))}
            </nav>
          </>
        )}

        <div className="mt-auto flex flex-col gap-2">
          {user && (
            <button
              type="button"
              onClick={() => void logout()}
              className="flex cursor-pointer items-center gap-[11px] rounded-[9px] border-none bg-transparent px-[10px] py-[9px] text-left text-sm text-meta hover:text-ink-2"
            >
              <LogOut size={15} />
              <span className="truncate">sair · {user.name}</span>
            </button>
          )}
          <div className="flex items-center gap-[9px] rounded-[10px] border border-border-alt bg-surface px-[10px] py-[11px]">
            <span
              className={`h-[7px] w-[7px] rounded-full ${collectionsQuery.isError ? "bg-accent" : "bg-success"}`}
            />
            <span className="font-mono text-xs text-meta">
              {collectionsQuery.isError
                ? "erro de sincronização"
                : collectionsQuery.isFetching
                  ? "sincronizando…"
                  : "sincronizado · agora"}
            </span>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
