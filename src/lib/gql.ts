type GqlResponse<T> = { data?: T; errors?: { message: string }[] };

export async function gqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  let json: GqlResponse<T>;

  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Empty response from server."
        : `Server error (${res.status}). Check API logs and DATABASE_URL.`,
    );
  }

  try {
    json = JSON.parse(text) as GqlResponse<T>;
  } catch {
    throw new Error(
      `Invalid response (${res.status}). ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  if (json.data === undefined) {
    throw new Error("No data in GraphQL response");
  }
  return json.data;
}
