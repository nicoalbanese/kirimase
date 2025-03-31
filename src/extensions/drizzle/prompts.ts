import { DBType, Provider } from "@/extensions/drizzle/config";
import { exit, TypeSelectOptions } from "@/utils/clack";
import { isCancel, select } from "@clack/prompts";

export const drizzle = async () => {
  const dbType = await select<TypeSelectOptions<DBType>, DBType>({
    message: "Select your database type",
    options: [
      { value: "sqlite", label: "SQLite" },
      { value: "mysql", label: "MySQL" },
      { value: "postgres", label: "PostgreSQL" },
    ],
    initialValue: "sqlite",
  });

  isCancel(dbType) && exit();

  const provider = await select<TypeSelectOptions<Provider>, Provider>({
    message: "Which provider would you like to use?",
    options: (() => {
      switch (dbType) {
        case "postgres":
          return [{ label: "Neon", value: "neon" }];
        case "mysql":
          return [{ label: "PlanetScale", value: "planetscale" }];
        case "sqlite":
          return [
            { label: "BetterSQLite3", value: "better-sqlite3" },
            { label: "Turso", value: "turso" },
          ];
        default:
          return [];
      }
    })(),
  });

  isCancel(provider) && exit();

  if (typeof provider === "symbol" || typeof dbType === "symbol") {
    return;
  }

  return { dbType, provider };
};
