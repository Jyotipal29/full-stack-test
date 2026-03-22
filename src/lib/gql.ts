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
  const json = (await res.json()) as GqlResponse<T>;
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.map((e) => e.message).join("; ") || res.statusText;
    throw new Error(msg || "GraphQL request failed");
  }
  if (json.data === undefined) {
    throw new Error("No data in GraphQL response");
  }
  return json.data;
}
