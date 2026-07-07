import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { CoverArt } from "../components/primitives";
import { collections, collectionStatusLabel } from "../data/songbook";

const coverLabelColor: Record<string, string> = {
  EP: "#caa988",
  demos: "#8a8276",
  single: "#8fae97",
};

export default function AlbumsPage() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-10 pt-[30px] pb-[22px]">
        <div>
          <h1 className="m-0 text-[30px] font-semibold tracking-[-0.02em] text-ink">Álbuns</h1>
          <div className="mt-[3px] font-mono text-xs text-meta-2">{collections.length} coleções</div>
        </div>
        <button
          type="button"
          className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-none bg-accent px-[18px] text-sm font-semibold text-on-accent"
        >
          <Plus size={16} strokeWidth={2.5} /> Novo álbum
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-10 pt-7">
        <div className="grid grid-cols-4 gap-6">
          {collections.map((album) => (
            <Link key={album.id} to={`/albums/${album.id}`} className="no-underline">
              <CoverArt variant={album.cover} className="flex aspect-square items-end rounded-card p-[14px]">
                <span
                  className="font-mono text-[11px]"
                  style={{ color: coverLabelColor[album.typeLabel] ?? "#8a8276" }}
                >
                  {album.typeLabel}
                </span>
              </CoverArt>
              <div className="mt-[11px] text-[17px] font-semibold text-ink">{album.title}</div>
              <div className="mt-[2px] font-mono text-xs text-meta-2">
                {album.type === "single"
                  ? `single · ${collectionStatusLabel[album.status]}`
                  : `${album.tracks.length} faixas · ${collectionStatusLabel[album.status]}`}
              </div>
            </Link>
          ))}

          <button
            type="button"
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-[10px] rounded-card border border-dashed border-border-dashed bg-transparent text-faint"
          >
            <Plus size={26} className="text-accent" />
            <span className="font-mono text-xs">Novo álbum</span>
          </button>
        </div>
      </div>
    </>
  );
}
