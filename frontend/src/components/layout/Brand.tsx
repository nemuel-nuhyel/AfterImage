import { Radar, ShieldCheck } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3 text-left">
      <span className={`${compact ? "h-10 w-10" : "h-12 w-12"} relative grid place-items-center rounded-lg border border-line2 bg-panel2 text-cyan`}>
        {compact ? <ShieldCheck size={19} /> : <Radar size={25} />}
        {!compact && <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-void bg-leaf" />}
      </span>
      <span>
        <span className={`${compact ? "text-xl tracking-[0.01em]" : "text-xl tracking-[0.01em]"} block font-black leading-none`}>
          After<span className="text-cyan">Math</span>
        </span>
        <span className="mt-1 block font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
          SOC investigation sim
        </span>
      </span>
    </span>
  );
}
