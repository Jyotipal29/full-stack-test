import { createYoga } from "graphql-yoga";
import { schema } from "@/graphql/schema";

export const runtime = "nodejs";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  landingPage: false,
  graphiql: process.env.NODE_ENV === "development",
});

export const GET = (request: Request) => yoga.fetch(request);
export const POST = (request: Request) => yoga.fetch(request);
