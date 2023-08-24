export type DBType = "pg" | "mysql" | "sqlite";
export type DBProviderItem = {
  name: string;
  value: string;
  disabled?: string | boolean;
};
export type DBProvider =
  | "postgresjs"
  | "node-postgres"
  | "neon"
  | "vercel-pg"
  | "supabase"
  | "aws"
  | "planetscale"
  | "mysql-2"
  | "better-sqlite3";
export type DBProviderOptions = {
  pg: DBProviderItem[];
  mysql: DBProviderItem[];
  sqlite: DBProviderItem[];
};
export type PMType = "npm" | "yarn" | "pnpm";
export type DBField = { name: string; type: string; references?: string };

export type Config = {
  hasSrc: boolean;
  driver: DBType;
  provider: DBProvider;
  preferredPackageManager: PMType;
};

export type ScaffoldSchema = {
  tableName: string;
  fields: DBField[];
  index?: string;
};
