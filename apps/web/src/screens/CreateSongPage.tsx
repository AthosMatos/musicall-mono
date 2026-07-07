import { useState } from "react";
import { FileUp, Mic, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MonoLabel } from "../components/primitives";

const startOptions = [
  { id: "lyrics", icon: PenLine, title: "Letra em branco", subtitle: "editor mono" },
  { id: "record", icon: Mic, title: "Gravar áudio", subtitle: "captura rápida" },
  { id: "import", icon: FileUp, title: "Importar arquivo", subtitle: "áudio ou texto" },
] as const;

const keys = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si"];

export default function CreateSongPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [songKey, setSongKey] = useState("");
  const [bpm, setBpm] = useState("");
  const [startWith, setStartWith] = useState<(typeof startOptions)[number]["id"]>("lyrics");

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg">
      <div className="w-[760px] max-w-[92vw]">
        <div className="mb-3 font-mono text-xs tracking-[0.08em] text-amber uppercase">Nova música</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da música"
          autoFocus
          className="w-full border-0 border-b border-solid border-border-strong bg-transparent pt-2 pb-[14px] font-ui text-[38px] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:text-faint"
        />

        <div className="mt-6 flex gap-[14px]">
          <label className="min-w-0 flex-1">
            <MonoLabel className="mb-2">Tom</MonoLabel>
            <select
              value={songKey}
              onChange={(e) => setSongKey(e.target.value)}
              className={`h-[46px] w-full cursor-pointer appearance-none rounded-[11px] border border-border-strong bg-surface-alt px-[15px] font-mono text-sm outline-none ${songKey ? "text-ink" : "text-meta"}`}
            >
              <option value="">selecionar ▾</option>
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0 flex-1">
            <MonoLabel className="mb-2">BPM</MonoLabel>
            <input
              value={bpm}
              onChange={(e) => setBpm(e.target.value.replace(/\D/g, ""))}
              placeholder="—"
              inputMode="numeric"
              className="h-[46px] w-full rounded-[11px] border border-border-strong bg-surface-alt px-[15px] font-mono text-sm text-ink outline-none placeholder:text-meta"
            />
          </label>
          <label className="min-w-0 flex-[1.3]">
            <MonoLabel className="mb-2">Adicionar a</MonoLabel>
            <select
              defaultValue=""
              className="h-[46px] w-full cursor-pointer appearance-none rounded-[11px] border border-border-strong bg-surface-alt px-[15px] font-mono text-sm text-meta outline-none"
            >
              <option value="">nenhum álbum ▾</option>
              <option value="mare-ep">Maré · EP</option>
              <option value="demos-2025">Demos 2025</option>
            </select>
          </label>
        </div>

        <MonoLabel className="mt-6 mb-[10px]">Começar por</MonoLabel>
        <div className="grid grid-cols-3 gap-[14px]">
          {startOptions.map(({ id, icon: Icon, title: optionTitle, subtitle }) => {
            const selected = startWith === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStartWith(id)}
                className={`cursor-pointer rounded-card border p-[18px] pt-5 text-left ${
                  selected ? "border-border-active bg-surface-active" : "border-border-alt bg-surface"
                }`}
              >
                <Icon size={22} className={`mb-[10px] ${selected ? "text-accent" : "text-ink-3"}`} />
                <div className="text-base font-semibold text-ink">{optionTitle}</div>
                <div className="mt-1 font-mono text-xs text-meta-2">{subtitle}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-[30px] flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-[46px] cursor-pointer items-center rounded-xl border border-border-strong bg-surface-alt px-[22px] text-sm text-ink-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => navigate("/songs")}
            className="flex h-[46px] cursor-pointer items-center rounded-xl border-none bg-accent px-[26px] text-sm font-semibold text-on-accent"
          >
            Criar música
          </button>
        </div>
      </div>
    </div>
  );
}
