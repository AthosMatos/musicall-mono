import { useState, type FormEvent } from "react";
import { Music2 } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "@monorepo/core/api";
import { MonoLabel } from "../components/primitives";
import { useAuth } from "../lib/auth-context";

type Mode = "login" | "register";

export default function LoginPage() {
  const { status, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "signedIn") {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "e-mail ou senha inválidos"
          : err instanceof ApiError && err.status !== 0
            ? err.message
            : "não foi possível conectar ao servidor",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "h-[46px] w-full rounded-[11px] border border-border-strong bg-surface-alt px-[15px] text-[15px] text-ink outline-none placeholder:text-faint focus:border-border-active";

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg">
      <div className="w-[380px] max-w-[92vw]">
        <div className="mb-8 flex items-center gap-[10px]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-accent text-on-accent">
            <Music2 size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold tracking-[-0.01em] text-ink">MusicAll</span>
        </div>

        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em] text-ink">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>
        <div className="mt-1 mb-7 font-mono text-xs text-meta-2">
          {mode === "login" ? "bem-vindo de volta ao seu ateliê" : "seu ateliê de músicas te espera"}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "register" && (
            <label>
              <MonoLabel className="mb-2">Nome</MonoLabel>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="como te chamamos?"
                className={inputClass}
              />
            </label>
          )}
          <label>
            <MonoLabel className="mb-2">E-mail</MonoLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className={inputClass}
            />
          </label>
          <label>
            <MonoLabel className="mb-2">Senha</MonoLabel>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          {error && (
            <div className="rounded-[10px] border border-[rgba(194,94,68,.35)] bg-[rgba(194,94,68,.1)] px-[13px] py-[10px] font-mono text-xs text-accent-soft">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex h-[48px] cursor-pointer items-center justify-center rounded-xl border-none bg-accent text-[15px] font-semibold text-on-accent disabled:opacity-60"
          >
            {busy ? "…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
          }}
          className="mt-6 cursor-pointer border-none bg-transparent p-0 font-mono text-xs text-meta hover:text-ink-3"
        >
          {mode === "login" ? "não tem conta? criar uma →" : "já tem conta? entrar →"}
        </button>
      </div>
    </div>
  );
}
