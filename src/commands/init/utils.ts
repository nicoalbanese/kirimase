import { DBProviderOptions } from "../../types.js";
import { wrapInParenthesis } from "../../utils.js";

export const DBProviders: DBProviderOptions = {
  pg: [
    { name: "Postgres.JS", value: "postgresjs" },
    { name: "node-postgres", value: "node-postgres" },
    { name: "Neon", value: "neon" },
    { name: "Vercel Postgres", value: "vercel-pg" },
    { name: "Supabase", value: "supabase" },
    {
      name: "AWS Data API",
      value: "aws",
      disabled: wrapInParenthesis("Not supported"),
    },
  ],
  mysql: [
    { name: "PlanetScale", value: "planetscale" },
    { name: "MySQL 2", value: "mysql-2" },
  ],
  sqlite: [{ name: "better-sqlite3", value: "better-sqlite3" }],
};
