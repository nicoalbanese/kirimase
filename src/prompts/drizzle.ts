import { group, select } from "@clack/prompts";

export const drizzle = () =>
  group({
    dbType: () =>
      select({
        message: "Select your database type",
        options: [
          { value: "SQLite", label: "SQLite" },
          { value: "PostgreSQL", label: "PostgreSQL" },
          { value: "MySQL", label: "MySQL" },
        ],
        initialValue: "SQLite",
      }),
    provider: ({ results: { dbType } }) =>
      select({
        message: "Which provider would you like to use?",
        options: [
          ...(dbType === "PostgreSQL"
            ? [{ label: "Neon", value: "neon" }]
            : []),
          ...(dbType === "MySQL"
            ? [{ label: "PlanetScale", value: "planetscale" }]
            : []),
          ...(dbType === "SQLite"
            ? [{ label: "BetterSQLite3", value: "better-sqlite3" }]
            : []),
          ...(dbType === "SQLite" ? [{ label: "Turso", value: "turso" }] : []),
        ],
      }),
  });
