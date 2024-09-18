import { AuthProvider } from "./commands/add/auth/next-auth/utils.ts";
import {
  pgColumns,
  mysqlColumns,
  sqliteColumns,
  prismaColumns,
} from "./utils.ts";

export type DBType = "pg" | "mysql" | "sqlite";
export type DBProviderItem = {
  name: string;
  value: string;
  disabled?: string | boolean;
};
export type PackageChoice = {
  name: string;
  value: AvailablePackage;
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
  | "better-sqlite3"
  | "turso";
// | "bun-sqlite";

export type DBProviderOptions = {
  pg: DBProviderItem[];
  mysql: DBProviderItem[];
  sqlite: DBProviderItem[];
};
export type PMType = "npm" | "yarn" | "pnpm" | "bun";

// export type FieldType =
//   | "id"
//   | "string"
//   | "text"
//   | "number"
//   | "references"
//   | "boolean";

export type DrizzleColumnType =
  | pgColumnType
  | mysqlColumnType
  | sqliteColumnType;

export type ColumnType = DrizzleColumnType | PrismaColumnType;

export type DBField<T extends ColumnType = ColumnType> = {
  name: string;
  type: T;
  references?: string;
  notNull?: boolean; // change to required later
  cascade?: boolean;
};

// export type DBField = {
//   name: string;
//   type: DrizzleColumnType;
//   references?: string;
//   notNull?: boolean; // change to required later
//   cascade?: boolean;
// };

// extend type or do a base type with prisma field and drizzle field

export type AvailablePackage =
  | "drizzle"
  | "trpc"
  | "next-auth"
  | "shadcn-ui"
  | "prisma"
  | "clerk"
  | "resend"
  | "lucia"
  | "kinde"
  | "stripe";

export type PackageType = "orm" | "auth" | "componentLib" | "misc";
export type ComponentLibType = "shadcn-ui";
export type ORMType = "drizzle" | "prisma";
export type AuthType = "next-auth" | "clerk" | "lucia" | "kinde";
export type MiscType = "trpc" | "stripe" | "resend";
export type AuthSubType = "self-hosted" | "managed";

export type Config = {
  hasSrc: boolean;
  preferredPackageManager: PMType;
  driver: DBType | null;
  provider: DBProvider | null;
  packages: AvailablePackage[];
  orm: ORMType | null;
  auth: AuthType | null;
  componentLib: ComponentLibType | null;
  t3: boolean;
  alias: string;
  analytics: boolean;
};

export type UpdateConfig = Partial<Config>;

export type InitOptions = {
  headless?: boolean;
  hasSrcFolder?: boolean;
  packageManager?: PMType;
  orm?: ORMType | null;
  db?: DBType;
  dbProvider?: DBProvider;
  auth?: AuthType | null;
  authProviders?: AuthProvider[] | null;
  miscPackages?: AvailablePackage[];
  componentLib?: ComponentLibType | null;
  includeExample?: boolean;
};

export type GenerateOptions = {
  fromFile?: string | null;
};

// export type BuildOptions = {
//   resources?: ("model" | "api_route" | "trpc_route" | "views_and_components")[];
//   table?: string;
//   belongsToUser?: "yes" | "no";
//   index?: string;
//   field?: DBField[];
//   migrate?: "yes" | "no";
// };

export type ScaffoldSchema = {
  tableName: string;
  fields: DBField[];
  index?: string;
};

export type pgColumnType = (typeof pgColumns)[number];
export type mysqlColumnType = (typeof mysqlColumns)[number];
export type sqliteColumnType = (typeof sqliteColumns)[number];
export type PrismaColumnType = (typeof prismaColumns)[number];

export type DotEnvItem = {
  key: string;
  value: string;
  isUrl?: boolean;
  isOptional?: boolean;
  customZodImplementation?: string;
  public?: boolean;
};
