import { useState } from "react";
import { AppModal } from "./ui/modal";

/**
 * Modal for editing a song's title. Reports the edited value via `onSave`;
 * the parent owns the mutation and closes the dialog on success.
 */
export function EditSongDialog({
  open,
  title,
  isSaving,
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  isSaving: boolean;
  onSave: (title: string) => void;
  onClose: () => void;
}) {
  const [draftTitle, setDraftTitle] = useState(title);
  const canSave = draftTitle.trim().length > 0 && !isSaving;

  // Reset the draft to the current title each time the modal opens (adjust
  // state during render — the React-recommended alternative to an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraftTitle(title);
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Editar música"
      footer={
        <>
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
        </>
      }
    >
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
    </AppModal>
  );
}
