import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "tall" | "fit";

export function PageShell({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "mx-auto w-full max-w-6xl px-4 py-5 sm:px-8 sm:py-6 lg:max-w-7xl"
          : "mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:max-w-7xl"
      }
    >
      {children}
    </div>
  );
}

export function PageCard({
  children,
  variant = "tall",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <div
      className={
        variant === "tall"
          ? "flex min-h-[min(76vh,920px)] w-full flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-md sm:p-8"
          : "flex w-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-md sm:p-6"
      }
    >
      {children}
    </div>
  );
}

export function CardBody({
  loading,
  loaderLabel,
  children,
  variant = "tall",
}: {
  loading: boolean;
  loaderLabel?: string;
  children: ReactNode;
  variant?: Variant;
}) {
  const fit = variant === "fit";
  return (
    <div
      className={
        fit
          ? "relative flex flex-col"
          : "relative flex min-h-[min(52vh,640px)] flex-1 flex-col"
      }
    >
      {loading ? (
        <div
          className={
            fit
              ? "flex min-h-[180px] flex-col items-center justify-center py-8"
              : "flex flex-1 flex-col items-center justify-center py-16"
          }
        >
          <Spinner label={loaderLabel} />
          <p className="mt-4 text-sm text-zinc-500">Loading…</p>
        </div>
      ) : fit ? (
        <div className="flex flex-col">{children}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </div>
  );
}
