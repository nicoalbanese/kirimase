import { z } from "zod";
import { Extension } from "karozu";
import { baseUtilities } from "karozu/utils";

export const propSchema = z.object({
  dbType: z.enum(["postgres", "mysql", "sqlite"]),
  provider: z.enum(["neon", "turso", "planetscale", "better-sqlite3"]),
});

export type DBType = z.infer<typeof propSchema>["dbType"];
export type Provider = z.infer<typeof propSchema>["provider"];

export const drizzle = new Extension({
  name: "drizzle-orm",
  version: "1.0.0",
  description: "Drizzle ORM for Next.js",
  author: "@nicoalbanese10",
  props: propSchema,
  postInstallScripts: (props) => [],
  dependencies: (props) => ({
    default: [
      {
        packageName: "drizzle-orm",
        version: "^2.0.0",
      },
      {
        packageName: "drizzle-kit",
        version: "^2.0.0",
        dev: true,
      },
    ],
    dbType: {
      postgres: [
        {
          packageName: "pg",
          version: "^8.7.1",
        },
      ],
      mysql: [
        {
          packageName: "mysql2",
          version: "^3.6.0",
        },
      ],
      sqlite: [
        {
          packageName: "@libsql/client",
          version: "^0.5.0",
        },
        {
          packageName: "better-sqlite3",
          version: "^9.0.0",
        },
      ],
    },
    provider: {
      neon: [
        {
          packageName: "@neondatabase/serverless",
          version: "^0.7.0",
        },
      ],
      planetscale: [
        {
          packageName: "planetscale",
          version: "latest",
        },
      ],
      turso: [
        {
          packageName: "@turso/client",
          version: "^0.1.0",
        },
      ],
    },
  }),
  utilities: {
    ...baseUtilities,
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
    formatDate: (date: Date) => date.toISOString(),
  },
});