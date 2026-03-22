export function Header({ compact }: { compact?: boolean }) {
  return (
    <header className={compact ? "mb-4 text-center" : "mb-8 text-center"}>
      <h1
        className={
          compact
            ? "text-2xl font-semibold tracking-tight text-zinc-900"
            : "text-3xl font-semibold tracking-tight text-zinc-900"
        }
      >
        ReleaseCheck
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Your all-in-one release checklist tool
      </p>
    </header>
  );
}
