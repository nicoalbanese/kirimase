export type DBType = "pg" | "mysql" | "sqlite";
export type PMType = "npm" | "yarn" | "pnpm";
export type DBField = { name: string; type: string; references?: string };

export type Config = {
  libPath: string;
  driver: DBType;
  preferredPackageManager: PMType;
};
