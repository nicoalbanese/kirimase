import {
  existsSync,
  readFileSync,
  // writeFileSync
} from "fs";
import {
  AvailablePackage,
  Config,
  DBProvider,
  DBProviderOptions,
  DBType,
  PMType,
} from "../../types.js";
import {
  createFile,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../utils.js";
import { consola } from "consola";
import { updateTsConfigPrismaTypeAlias } from "../add/orm/utils.js";
import { addToInstallList } from "../add/utils.js";
import { addNanoidToUtils } from "../add/orm/drizzle/utils.js";
import {
  format as prettierFormat,
  resolveConfigFile,
  resolveConfig as resolvePrettierConfig,
} from "prettier";

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
      disabled: "(Not supported)",
    },
  ],
  mysql: [
    { name: "PlanetScale", value: "planetscale" },
    { name: "MySQL 2", value: "mysql-2" },
  ],
  sqlite: [
    { name: "better-sqlite3", value: "better-sqlite3" },
    { name: "turso", value: "turso" },
    // { name: "Bun SQLite", value: "bun-sqlite" },
  ],
};

export const checkForExistingPackages = async (rootPath: string) => {
  consola.start("Checking project for existing packages...");
  // get package json
  // const { preferredPackageManager } = readConfigFile();
  const packageJsonInitText = readFileSync("package.json", "utf-8");

  let configObj: Partial<Config> = {
    packages: [],
  };
  const packages: Partial<Record<AvailablePackage, string[]>> = {
    drizzle: ["drizzle-orm", "drizzle-kit"],
    trpc: ["@trpc/client", "@trpc/react-query", "@trpc/server", "@trpc/next"],
    clerk: ["@clerk/nextjs"],
    lucia: ["lucia"],
    supabase: ["@supabase/supabase-js", "@supabase/ssr"],
    prisma: ["prisma"],
    resend: ["resend"],
    stripe: ["stripe", "@stripe/stripe-js"],
    "next-auth": ["next-auth", "@auth/core"],
  };

  const packageTypeMappings: Partial<
    Record<AvailablePackage, "orm" | "auth" | null>
  > = {
    stripe: null,
    resend: null,
    prisma: "orm",
    trpc: null,
    clerk: "auth",
    "next-auth": "auth",
    lucia: "auth",
    supabase: "auth",
    drizzle: "orm",
  };

  const pkgDependencies = JSON.parse(packageJsonInitText);
  const allDependencies = {
    regular: pkgDependencies.dependencies,
    dev: pkgDependencies.devDependencies,
  };
  const dependenciesStringified = JSON.stringify(allDependencies);
  for (const [key, terms] of Object.entries(packages)) {
    // console.log(key, terms);
    if (!terms) continue;

    // Loop over each term in the array
    let existsInProject = false;
    for (const term of terms) {
      // Check if the term is present in the text file content
      if (dependenciesStringified.includes(term)) {
        // set object
        existsInProject = true;
        // if (packageTypeMappings[key] !== null) {
        //   configObj[packageTypeMappings[key]] = key;
        //   configObj.packages.push(key as AvailablePackage);
        // }
      }
    }
    if (existsInProject && packageTypeMappings[key] !== null)
      configObj[packageTypeMappings[key]] = key;
    if (existsInProject) configObj.packages.push(key as AvailablePackage);
  }

  // check for shadcn ui
  const hasComponentsJson = existsSync("components.json");
  if (hasComponentsJson) {
    configObj.componentLib = "shadcn-ui";
    configObj.packages.push("shadcn-ui");
  }

  // check for driver
  // prisma: check schema for provider value
  // drizzle: check package json
  const providerMappings: Record<DBProvider, string> = {
    aws: "",
    neon: "@neondatabase/serverless",
    supabase: "pg", // fix later
    "mysql-2": "mysql2",
    postgresjs: "postgres",
    "node-postgres": "pg",
    "vercel-pg": "@vercel/postgres",
    planetscale: "@planetscale/database",
    "better-sqlite3": "better-sqlite3",
    turso: "@libsql/client",
  };
  const providerDriverMappings: Record<DBProvider, DBType> = {
    aws: "pg",
    neon: "pg",
    supabase: "pg", // fix later
    "mysql-2": "mysql",
    postgresjs: "pg",
    "node-postgres": "pg",
    "vercel-pg": "pg",
    planetscale: "mysql",
    "better-sqlite3": "sqlite",
    turso: "sqlite",
  };
  for (const [key, term] of Object.entries(providerMappings)) {
    // console.log(key, terms);
    if (!term) continue;

    // Loop over each term in the array
    let existsInProject = false;

    if (dependenciesStringified.includes(term)) existsInProject = true;
    if (existsInProject && providerMappings[key] !== null) {
      configObj.provider = key as DBProvider;
      configObj.driver = providerDriverMappings[key];
    }
  }

  // updated check (nov 2023) for ct3a
  packageJsonInitText.includes("ct3aMetadata")
    ? (configObj.t3 = true)
    : (configObj.t3 = false);

  if (configObj.packages.length > 0) {
    consola.success(
      "Successfully searched project and found the following packages already installed:"
    );
    consola.info(configObj.packages.map((pkg) => pkg).join(", "));
  } else {
    consola.success(
      "Successfully searched project and found no additional packages."
    );
  }

  // if (prisma) check db driver
  if (configObj.orm === "prisma") {
    const schemaFile = readFileSync("prisma/schema.prisma");
    schemaFile.includes(`provider = "sqlite"`)
      ? (configObj.driver = "sqlite")
      : null;

    schemaFile.includes(`provider = "postgresql"`)
      ? (configObj.driver = "pg")
      : null;

    if (schemaFile.includes(`provider = "mysql"`)) {
      configObj.driver = "mysql";
      if (schemaFile.includes(`relationMode = "prisma"`))
        configObj.provider = "planetscale";
    }
  }

  if (configObj.t3 === true) {
    if (configObj.orm === "prisma") {
      // add zod generator to schema to schema.prisma
      // consola.start(
      //   "Installing zod-prisma for use with Kirimase's generate function."
      // );
      addToInstallList({ regular: [], dev: ["zod-prisma"] });
      // await installPackages(
      //   { regular: "", dev: "zod-prisma" },
      //   preferredPackageManager,
      // );
      await addZodGeneratorToPrismaSchema();
      // consola.success("Successfully installed!");

      await updateTsConfigPrismaTypeAlias();
    } else if (configObj.orm === "drizzle") {
      // consola.start(
      //   "Installing drizzle-zod for use with Kirimase's generate function."
      // );
      // await installPackages(
      //   { regular: "drizzle-zod", dev: "" },
      //   preferredPackageManager
      // );
      addToInstallList({ regular: ["drizzle-zod", "nanoid"], dev: [] });
      await addNanoidToUtils();
      // consola.success("Successfully installed!");
    }
  }
  // if (drizzle), check if using one schema file or schema directory - perhaps just force users?

  // update config file
  await updateConfigFile(configObj);
};

const addZodGeneratorToPrismaSchema = async () => {
  const hasSchema = existsSync("prisma/schema.prisma");
  if (!hasSchema) {
    console.error("Prisma schema not found!");
    return;
  }
  const schema = readFileSync("prisma/schema.prisma", "utf-8");
  const newSchema = schema.concat(`
generator zod {
  provider              = "zod-prisma"
  output                = "./zod"
  relationModel         = true
  modelCase             = "camelCase"
  modelSuffix           = "Schema"
  useDecimalJs          = true
  prismaJsonNullability = true
}
`);

  await replaceFile("prisma/schema.prisma", newSchema);
  consola.info("Updated Prisma schema");
};

export const checkForPackageManager = (): PMType | null => {
  const bun = existsSync("bun.lockb");
  const pnpm = existsSync("pnpm-lock.yaml");
  const yarn = existsSync("yarn.lock");

  if (bun) return "bun";
  if (pnpm) return "pnpm";
  if (yarn) return "yarn";

  return null;
};

export const createPrettierConfigFileIfNotExist = async () => {
  const userPrettierConfigPath = await resolveConfigFile();

  // Throws an error if there is an error during parsing the users prettier config file
  let prettierConfig = await resolvePrettierConfig(userPrettierConfigPath);

  if (prettierConfig != null)
    consola.success(
      "Prettier config found! Using prettier config for formatting..."
    );

  if (prettierConfig === null) {
    consola.info(
      "Prettier config not found! Create default prettier config for further usage..."
    );

    await createDefaultPrettierConfig();
  }
};

export const formatFileContentWithPrettier = async (
  content: string,
  filePath: string,
  skipPrettier?: boolean
) => {
  if (skipPrettier) return content;

  const prettierConfigPath = await resolveConfigFile();

  // Throws an error if there is an error during parsing the users prettier config file
  let prettierConfig = await resolvePrettierConfig(prettierConfigPath);

  if (
    prettierConfig &&
    typeof prettierConfig === "object" &&
    !prettierConfig.filepath
  )
    prettierConfig.filepath = filePath;

  return await prettierFormat(content, prettierConfig);
};

const createDefaultPrettierConfig = async () => {
  /** @link https://prettier.io/docs/en/configuration#basic-configuration */
  const defaultPrettierConfig = {
    trailingComma: "es5" as const,
    tabWidth: 4,
    semi: false,
    singleQuote: true,
  };

  await createFile(
    ".prettierrc",
    JSON.stringify(defaultPrettierConfig, null, 2),
    true
  );
};

export const toggleAnalytics = (input: { toggle?: boolean }) => {
  const { analytics } = readConfigFile();

  if (input.toggle) {
    updateConfigFile({ analytics: !analytics });

    consola.info(`Anonymous analytics are now ${analytics ? "off" : "on"}`);
  } else {
    consola.info(
      `Anonymous analytics are currently ${analytics ? "on" : "off"}`
    );
  }
};
