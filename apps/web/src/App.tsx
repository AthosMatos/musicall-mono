import { CounterButton } from "@monorepo/ui/counter-button";
import { Link } from "@monorepo/ui/link";

export default function Index() {
  return (
    <div className="container">
      <h1 className="title">
        <span>Athos Monorepo (Vite + NestJS) template</span>
      </h1>
      <CounterButton />
      <p className="description">
        Built With <Link href="https://turborepo.dev">Turborepo</Link>
      </p>
    </div>
  );
}
