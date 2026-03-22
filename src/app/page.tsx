"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { IconEye, IconTrash } from "@/components/icons";
import { gqlRequest } from "@/lib/gql";

type ReleaseRow = {
  id: string;
  name: string;
  date: string;
  status: "PLANNED" | "ONGOING" | "DONE";
};

const RELEASES_QUERY = /* GraphQL */ `
  query Releases {
    releases {
      id
      name
      date
      status
    }
  }
`;

const DELETE_MUTATION = /* GraphQL */ `
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this release?")) return;
    try {
      await gqlRequest(DELETE_MUTATION, { id });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-4xl px-4 py-10 sm:px-6">
      <Header />
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-[var(--primary)]">
            All releases
          </span>
          <Link
            href="/release/new"
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            New release +
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : releases.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No releases yet. Create one with &quot;New release +&quot;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="pb-2 pr-3 font-medium">Release</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-2 font-medium">View</th>
                  <th className="pb-2 font-medium">Delete</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-100">
                    <td className="py-3 pr-3 font-medium text-zinc-900">
                      {r.name}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-3 pr-3 text-zinc-700">
                      {statusLabel(r.status)}
                    </td>
                    <td className="py-3 pr-2">
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
                        onClick={() => void handleDelete(r.id)}
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
      </div>
    </div>
  );
}
