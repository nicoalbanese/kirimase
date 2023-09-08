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
// | "bun-sqlite";

export type DBProviderOptions = {
  pg: DBProviderItem[];
  mysql: DBProviderItem[];
  sqlite: DBProviderItem[];
};
export type PMType = "npm" | "yarn" | "pnpm"; // | "bun";

// export type FieldType =
//   | "id"
//   | "string"
//   | "text"
//   | "number"
//   | "references"
//   | "boolean";

export type FieldType = pgColumnType | mysqlColumnType | sqliteColumnType;

export type DBField = {
  name: string;
  type: FieldType;
  references?: string;
  notNull?: boolean; // change to required later
  cascade?: boolean;
};

export type AvailablePackage = "drizzle" | "trpc" | "next-auth" | "shadcn-ui";
export type PackageType = "orm" | "auth" | "misc";
export type ORMType = "drizzle";
export type AuthType = "next-auth";

export type Config = {
  hasSrc: boolean;
  preferredPackageManager: PMType;
  driver: DBType | null;
  provider: DBProvider | null;
  packages: AvailablePackage[];
  orm: ORMType | null;
  auth: AuthType | null;
};

export type UpdateConfig = Partial<Config>;

export type ScaffoldSchema = {
  tableName: string;
  fields: DBField[];
  index?: string;
};

export type pgColumnType =
  | "varchar"
  | "text"
  | "number"
  | "float"
  | "boolean"
  | "references"
  | "timestamp"
  | "date"
  | "json";

export type mysqlColumnType =
  | "varchar"
  | "text"
  | "number"
  | "float"
  | "boolean"
  | "references"
  | "date"
  | "timestamp"
  | "json";

export type sqliteColumnType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "timestamp"
  | "blob";
