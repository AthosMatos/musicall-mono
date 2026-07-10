import { useState } from "react";
import { X } from "lucide-react";

/**
 * Modal for editing a song's title. Reports the edited value via `onSave`;
 * the parent owns the mutation and closes the dialog on success.
 */
export function EditSongDialog({
  title,
  isSaving,
  onSave,
  onClose,
}: {
  title: string;
  isSaving: boolean;
  onSave: (title: string) => void;
  onClose: () => void;
}) {
  const [draftTitle, setDraftTitle] = useState(title);
  const canSave = draftTitle.trim().length > 0 && !isSaving;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[420px] flex-col overflow-hidden rounded-2xl border border-border-alt bg-bg shadow-drag"
      >
        <header className="flex items-center gap-4 border-b border-border px-5 py-4">
          <h2 className="m-0 flex-1 text-lg font-semibold text-ink">Editar música</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex cursor-pointer border-none bg-transparent p-0 text-[#7a7268] hover:text-ink-2"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-5">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.08em] text-meta uppercase">Título</span>
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Título da música"
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) onSave(draftTitle.trim());
              }}
              className="h-11 rounded-xl border border-border-strong bg-surface-alt px-[15px] text-sm text-ink outline-none placeholder:text-faint focus:border-border-active"
            />
          </label>
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
            onClick={() => onSave(draftTitle.trim())}
            className="cursor-pointer rounded-xl border-none bg-accent px-5 py-[10px] text-sm font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
