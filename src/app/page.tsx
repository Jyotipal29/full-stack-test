"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CardBody, PageCard, PageShell } from "@/components/PageCard";
import { Header } from "@/components/Header";
import { IconEye, IconTrash } from "@/components/icons";
import { gqlRequest } from "@/lib/gql";

type ReleaseRow = {
  id: string;
  name: string;
  date: string;
  status: "PLANNED" | "ONGOING" | "DONE";
};

const RELEASES_QUERY = `
  query Releases {
    releases {
      id
      name
      date
      status
    }
  }
`;

const DELETE_MUTATION = `
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

function statusLabel(s: ReleaseRow["status"]) {
  switch (s) {
    case "PLANNED":
      return "Planned";
    case "ONGOING":
      return "Ongoing";
    case "DONE":
      return "Done";
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function HomePage() {
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await gqlRequest<{ releases: ReleaseRow[] }>(RELEASES_QUERY);
      setReleases(data.releases);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    try {
      await gqlRequest(DELETE_MUTATION, { id });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <PageShell>
      <Header />
      <PageCard>
        <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-[var(--primary)]">
            All releases
          </span>
          <Link
            href="/release/new"
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            New release +
          </Link>
        </div>

        {error && (
          <p className="mb-4 shrink-0 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <CardBody loading={loading} loaderLabel="Loading releases">
          {releases.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <p className="max-w-sm text-sm text-zinc-600">
                No releases yet. Create one with &quot;New release +&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="pb-3 pr-4 font-medium">Release</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-3 font-medium">View</th>
                    <th className="pb-3 font-medium">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-100">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        {r.name}
                      </td>
                      <td className="py-3 pr-4 text-zinc-700">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3 pr-4 text-zinc-700">
                        {statusLabel(r.status)}
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          href={`/release/${r.id}`}
                          className="inline-flex rounded border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-50"
                          aria-label={`View ${r.name}`}
                        >
                          <IconEye />
                        </Link>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: r.id, name: r.name })
                          }
                          className="inline-flex rounded border border-zinc-200 p-1.5 text-zinc-600 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Delete ${r.name}`}
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </PageCard>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete release?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be removed permanently. This cannot be undone.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </PageShell>
  );
}
