import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { CollectionLike } from "../lib/model";
import { CollectionCover } from "./CollectionCover";

type CollectionWithCover = CollectionLike & { coverMediaId: string | null };

/**
 * Modal for editing a collection's title, description and cover image. Reports
 * the edited values (and an optional newly-picked cover file) via `onSave`; the
 * parent owns the upload + mutation and closes on success.
 */
export function EditCollectionDialog({
  collection,
  title,
  description,
  isSaving,
  onSave,
  onClose,
}: {
  collection: CollectionWithCover;
  title: string;
  description: string;
  isSaving: boolean;
  onSave: (title: string, description: string, coverFile: File | null) => void;
  onClose: () => void;
}) {
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSave = draftTitle.trim().length > 0 && !isSaving;

  // revoke the object URL when it changes or the dialog unmounts
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[460px] flex-col overflow-hidden rounded-2xl border border-border-alt bg-bg shadow-drag"
      >
        <header className="flex items-center gap-4 border-b border-border px-5 py-4">
          <h2 className="m-0 flex-1 text-lg font-semibold text-ink">Editar coleção</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a7268] hover:text-ink-2"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex gap-4 p-5">
          {/* cover picker */}
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Alterar capa"
              className="group relative block h-[92px] w-[92px] cursor-pointer overflow-hidden rounded-xl border-none p-0"
            >
              {coverPreview ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverPreview})` }}
                />
              ) : (
                <CollectionCover collection={collection} className="h-full w-full" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-ink opacity-0 transition-opacity group-hover:opacity-100">
                <ImagePlus size={22} />
              </div>
            </button>
          </div>

          {/* title + description */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[11px] tracking-[0.08em] text-meta uppercase">Título</span>
              <input
                autoFocus
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Título da coleção"
                className="h-11 rounded-xl border border-border-strong bg-surface-alt px-[15px] text-sm text-ink outline-none placeholder:text-faint focus:border-border-active"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[11px] tracking-[0.08em] text-meta uppercase">Descrição</span>
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
                className="resize-none rounded-xl border border-border-strong bg-surface-alt px-[15px] py-3 text-sm leading-[1.5] text-ink outline-none placeholder:text-faint focus:border-border-active"
              />
            </label>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-border-strong bg-transparent px-4 py-[10px] text-sm text-ink-2 hover:bg-surface-active"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(draftTitle.trim(), draftDescription.trim(), coverFile)}
            className="cursor-pointer rounded-xl border-none bg-accent px-5 py-[10px] text-sm font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
