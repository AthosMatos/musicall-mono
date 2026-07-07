import { Disc3, Heart, Home, Music2 } from "lucide-react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { collections } from "../data/songbook";
import { MonoLabel } from "./primitives";

const collectionDot: Record<string, string> = {
  "mare-ep": "#c25e44",
  "demos-2025": "#cf9b3f",
  "folha-seca-single": "#6f8a72",
};

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

        <MonoLabel className="px-2 pt-5 pb-[6px]">Coleções</MonoLabel>
        <nav className="flex flex-col gap-[2px]">
          {collections.map((c) => (
            <NavLink
              key={c.id}
              to={`/albums/${c.id}`}
              className={navRowClass(c.id === activeCollectionId)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: collectionDot[c.id] ?? "#6f8a72" }}
              />
              <span className={c.id === activeCollectionId ? "" : "text-ink-2"}>
                {c.typeLabel === "EP" ? `${c.title} · EP` : c.title}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-[9px] rounded-[10px] border border-border-alt bg-surface px-[10px] py-[11px]">
          <span className="h-[7px] w-[7px] rounded-full bg-success" />
          <span className="font-mono text-xs text-meta">sincronizado · agora</span>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
