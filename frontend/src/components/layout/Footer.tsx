import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="border-t border-line bg-void/90">
      <div className="mx-auto flex w-[calc(100%_-_2rem)] max-w-[1440px] flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
        <Brand />
        <p className="font-mono text-xs text-muted">(c) 2026 AfterMath Labs - Classified Training Environment</p>
        <div className="flex gap-6 text-sm text-muted">
          <a href="#">Security</a>
          <a href="#">Docs</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
