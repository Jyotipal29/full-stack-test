import { createSchema } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { prisma } from "@/lib/prisma";
import { RELEASE_STEPS, STEP_COUNT, isValidStepId } from "@/lib/steps";
import { computeStatus, type ReleaseStatus } from "@/lib/status";

const typeDefs = `
  enum ReleaseStatus {
    PLANNED
    ONGOING
    DONE
  }

  type StepDefinition {
    id: Int!
    label: String!
  }

  type StepState {
    id: Int!
    label: String!
    completed: Boolean!
  }

  type Release {
    id: ID!
    name: String!
    date: String!
    status: ReleaseStatus!
    additionalInfo: String
    completedStepIds: [Int!]!
    steps: [StepState!]!
  }

  input CreateReleaseInput {
    name: String!
    date: String!
    additionalInfo: String
  }

  input UpdateReleaseInput {
    name: String
    date: String
    additionalInfo: String
  }

  type Query {
    stepDefinitions: [StepDefinition!]!
    releases: [Release!]!
    release(id: ID!): Release
  }

  type Mutation {
    createRelease(input: CreateReleaseInput!): Release!
    updateRelease(id: ID!, input: UpdateReleaseInput!): Release!
    deleteRelease(id: ID!): Boolean!
    toggleStep(releaseId: ID!, stepId: Int!): Release!
  }
`;

function toGqlStatus(s: ReleaseStatus): "PLANNED" | "ONGOING" | "DONE" {
  switch (s) {
    case "planned":
      return "PLANNED";
    case "ongoing":
      return "ONGOING";
    case "done":
      return "DONE";
  }
}

function mapRelease(r: {
  id: string;
  name: string;
  date: Date;
  additionalInfo: string | null;
  completedStepIds: number[];
}) {
  const completed = new Set(r.completedStepIds);
  const status = computeStatus(r.completedStepIds);
  return {
    id: r.id,
    name: r.name,
    date: r.date.toISOString(),
    status: toGqlStatus(status),
    additionalInfo: r.additionalInfo,
    completedStepIds: [...r.completedStepIds].sort((a, b) => a - b),
    steps: RELEASE_STEPS.map((label, id) => ({
      id,
      label,
      completed: completed.has(id),
    })),
  };
}

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      stepDefinitions: () =>
        RELEASE_STEPS.map((label, id) => ({ id, label })),
      releases: async () => {
        const rows = await prisma.release.findMany({ orderBy: { date: "asc" } });
        return rows.map(mapRelease);
      },
      release: async (_: unknown, args: { id: string }) => {
        const r = await prisma.release.findUnique({ where: { id: args.id } });
        return r ? mapRelease(r) : null;
      },
    },
    Mutation: {
      createRelease: async (
        _: unknown,
        args: {
          input: { name: string; date: string; additionalInfo?: string | null };
        },
      ) => {
        const name = args.input.name?.trim();
        if (!name) {
          throw new GraphQLError("Name is required");
        }
        const date = new Date(args.input.date);
        if (Number.isNaN(date.getTime())) {
          throw new GraphQLError("Invalid date");
        }
        const row = await prisma.release.create({
          data: {
            name,
            date,
            additionalInfo: args.input.additionalInfo?.trim() || null,
            completedStepIds: [],
          },
        });
        return mapRelease(row);
      },
      updateRelease: async (
        _: unknown,
        args: {
          id: string;
          input: {
            name?: string | null;
            date?: string | null;
            additionalInfo?: string | null;
          };
        },
      ) => {
        const existing = await prisma.release.findUnique({ where: { id: args.id } });
        if (!existing) {
          throw new GraphQLError("Release not found");
        }
        const data: {
          name?: string;
          date?: Date;
          additionalInfo?: string | null;
        } = {};
        if (args.input.name !== undefined && args.input.name !== null) {
          const n = args.input.name.trim();
          if (!n) throw new GraphQLError("Name cannot be empty");
          data.name = n;
        }
        if (args.input.date !== undefined && args.input.date !== null) {
          const d = new Date(args.input.date);
          if (Number.isNaN(d.getTime())) throw new GraphQLError("Invalid date");
          data.date = d;
        }
        if (args.input.additionalInfo !== undefined) {
          data.additionalInfo =
            args.input.additionalInfo === null || args.input.additionalInfo === ""
              ? null
              : args.input.additionalInfo.trim() || null;
        }
        const row = await prisma.release.update({
          where: { id: args.id },
          data,
        });
        return mapRelease(row);
      },
      deleteRelease: async (_: unknown, args: { id: string }) => {
        try {
          await prisma.release.delete({ where: { id: args.id } });
          return true;
        } catch {
          throw new GraphQLError("Release not found");
        }
      },
      toggleStep: async (_: unknown, args: { releaseId: string; stepId: number }) => {
        if (!isValidStepId(args.stepId)) {
          throw new GraphQLError(
            `Invalid step id (must be 0-${STEP_COUNT - 1})`,
          );
        }
        const existing = await prisma.release.findUnique({
          where: { id: args.releaseId },
        });
        if (!existing) {
          throw new GraphQLError("Release not found");
        }
        const set = new Set(existing.completedStepIds);
        if (set.has(args.stepId)) {
          set.delete(args.stepId);
        } else {
          set.add(args.stepId);
        }
        const completedStepIds = Array.from(set).sort((a, b) => a - b);
        const row = await prisma.release.update({
          where: { id: args.releaseId },
          data: { completedStepIds },
        });
        return mapRelease(row);
      },
    },
  },
});
