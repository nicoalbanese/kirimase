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

export type FieldType =
  | "id"
  | "string"
  | "text"
  | "number"
  | "references"
  | "boolean";

export type DBField = {
  name: string;
  type: FieldType;
  references?: string;
  notNull?: boolean; // change to required later
};

export type AvailablePackage = "drizzle" | "trpc" | "next-auth";

export type Config = {
  hasSrc: boolean;
  driver?: DBType;
  provider?: DBProvider;
  preferredPackageManager: PMType;
  packages?: AvailablePackage[];
};

export type UpdateConfig = {
  hasSrc?: boolean;
  driver?: DBType;
  provider?: DBProvider;
  preferredPackageManager?: PMType;
  packages?: AvailablePackage[];
};

export type ScaffoldSchema = {
  tableName: string;
  fields: DBField[];
  index?: string;
};

export type pgColumnType = "string" | "number" | "boolean" | "references";
export type mysqlColumnType = "string" | "number" | "boolean" | "references";
export type sqliteColumnType = "string" | "number";
