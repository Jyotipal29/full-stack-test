export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="h-11 w-11 shrink-0 animate-spin rounded-full border-[3px] border-zinc-200 border-t-[var(--primary)]"
      role="status"
      aria-label={label}
    />
  );
}
