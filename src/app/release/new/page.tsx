"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "@/components/Header";
import { IconCheck } from "@/components/icons";
import { gqlRequest } from "@/lib/gql";

const CREATE = /* GraphQL */ `
  mutation Create($input: CreateReleaseInput!) {
    createRelease(input: $input) {
      id
    }
  }
`;

export default function NewReleasePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const iso = new Date(date);
      if (Number.isNaN(iso.getTime())) {
        setError("Please pick a valid date and time.");
        return;
      }
      const data = await gqlRequest<{
        createRelease: { id: string };
      }>(CREATE, {
        input: {
          name: name.trim(),
          date: iso.toISOString(),
          additionalInfo: additionalInfo.trim() || null,
        },
      });
      router.push(`/release/${data.createRelease.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create release");
    } finally {
      setSaving(false);
    }
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
            <span className="text-zinc-800">New release</span>
          </nav>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
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
              placeholder="e.g. Version 1.0.1"
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
