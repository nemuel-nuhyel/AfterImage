import type { ReactNode } from "react";
import { Kicker } from "../ui/Kicker";

export function PageHeader({
  kicker,
  title,
  copy,
  action,
}: {
  kicker: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-4xl">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-4 text-balance text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/72 sm:text-base">{copy}</p>
      </div>
      {action}
    </div>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1440px] gap-6 py-8">
      {children}
    </section>
  );
}
