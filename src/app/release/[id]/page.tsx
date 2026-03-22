"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { IconCheck, IconTrash } from "@/components/icons";
import { gqlRequest } from "@/lib/gql";

const RELEASE_QUERY = /* GraphQL */ `
  query Release($id: ID!) {
    release(id: $id) {
      id
      name
      date
      status
      additionalInfo
      steps {
        id
        label
        completed
      }
    }
  }
`;

const UPDATE_MUTATION = /* GraphQL */ `
  mutation Update($id: ID!, $input: UpdateReleaseInput!) {
    updateRelease(id: $id, input: $input) {
      id
      name
      date
      status
      additionalInfo
      steps {
        id
        label
        completed
      }
    }
  }
`;

const TOGGLE_MUTATION = /* GraphQL */ `
  mutation Toggle($releaseId: ID!, $stepId: Int!) {
    toggleStep(releaseId: $releaseId, stepId: $stepId) {
      id
      status
      steps {
        id
        label
        completed
      }
    }
  }
`;

const DELETE_MUTATION = /* GraphQL */ `
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

type StepState = { id: number; label: string; completed: boolean };

type ReleaseDetail = {
  id: string;
  name: string;
  date: string;
  status: string;
  additionalInfo: string | null;
  steps: StepState[];
};

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await gqlRequest<{ release: ReleaseDetail | null }>(
        RELEASE_QUERY,
        { id },
      );
      if (!data.release) {
        setRelease(null);
        return;
      }
      setRelease(data.release);
      setName(data.release.name);
      setDate(toDatetimeLocalValue(data.release.date));
      setAdditionalInfo(data.release.additionalInfo ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load release");
      setRelease(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSaving(true);
    try {
      const iso = new Date(date);
      if (Number.isNaN(iso.getTime())) {
        setError("Please pick a valid date and time.");
        return;
      }
      const data = await gqlRequest<{ updateRelease: ReleaseDetail }>(
        UPDATE_MUTATION,
        {
          id,
          input: {
            name: name.trim(),
            date: iso.toISOString(),
            additionalInfo: additionalInfo.trim() || null,
          },
        },
      );
      setRelease(data.updateRelease);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(stepId: number) {
    if (!id) return;
    try {
      const data = await gqlRequest<{ toggleStep: ReleaseDetail }>(
        TOGGLE_MUTATION,
        { releaseId: id, stepId },
      );
      setRelease((prev) =>
        prev
          ? {
              ...prev,
              status: data.toggleStep.status,
              steps: data.toggleStep.steps,
            }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this release?")) return;
    try {
      await gqlRequest(DELETE_MUTATION, { id });
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Header />
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Header />
        <p className="text-sm text-zinc-600">Release not found.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--primary)] hover:underline">
          Back to all releases
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-4xl px-4 py-10 sm:px-6">
      <Header />
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="text-sm">
            <Link href="/" className="text-[var(--primary)] hover:underline">
              All releases
            </Link>
            <span className="text-zinc-400"> &gt; </span>
            <span className="text-zinc-800">{release.name}</span>
          </nav>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="inline-flex items-center gap-2 self-start rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 sm:self-auto"
          >
            <IconTrash className="text-red-600" />
            Delete
          </button>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">
              Release
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-medium text-zinc-700">
              Date
            </label>
            <input
              id="date"
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-md rounded border border-zinc-300 px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Checklist</p>
            <ul className="space-y-2">
              {release.steps.map((s) => (
                <li key={s.id} className="flex gap-3 text-sm">
                  <input
                    type="checkbox"
                    id={`step-${s.id}`}
                    checked={s.completed}
                    onChange={() => void handleToggle(s.id)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor={`step-${s.id}`} className="text-zinc-800">
                    {s.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label
              htmlFor="remarks"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Additional remarks / tasks
            </label>
            <textarea
              id="remarks"
              rows={4}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Please enter any other important notes for the release…"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <IconCheck className="text-white" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
