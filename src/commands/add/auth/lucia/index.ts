import {
  addPackageToConfig,
  createFile,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { luciaGenerators } from "./generators.js";
import {
  generateDrizzleAdapterDriverMappings,
  DrizzleLuciaSchema,
  generatePrismaAdapterDriverMappings,
  addLuciaToPrismaSchema,
  updateDrizzleDbIndex,
  addNodeRsFlagsToNextConfig,
} from "./utils.js";

import fs from "fs";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { updateTrpcWithSessionIfInstalled } from "../shared/index.js";
import { addToInstallList } from "../../utils.js";

export const addLucia = async () => {
  // get dbtype and provider
  const { orm, provider, rootPath, driver, componentLib, t3 } =
    readConfigFile();

  const {
    generateViewsAndComponents,
    generateAuthDirFiles,
    generateUserServerActions,
  } = luciaGenerators;

  const { lucia, shared, drizzle } = getFilePaths();
  const dbIndex = getDbIndexPath();

  // create auth form component
  // generate sign-in and sign-up pages
  let viewsAndComponents: {
    signUpPage: string;
    signInPage: string;
    authFormErrorComponent: string;
    homePage: string;
    loadingPage: string;
    updatedSignOutButton: string;
  };

  if (componentLib === "shadcn-ui") {
    // await installShadcnUI(packages);
    // await installShadcnUIComponents(["input", "label"]);
    viewsAndComponents = generateViewsAndComponents(true);
  } else {
    viewsAndComponents = generateViewsAndComponents(false);
  }
  createFile(
    formatFilePath(lucia.signInPage, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.signInPage
  );
  createFile(
    formatFilePath(lucia.signUpPage, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.signUpPage
  );
  createFile(
    formatFilePath(lucia.formErrorComponent, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.authFormErrorComponent
  );
  replaceFile(
    formatFilePath(shared.init.dashboardRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.homePage
  );
  createFile(
    rootPath.concat("app/loading.tsx"),
    viewsAndComponents.loadingPage
  );

  createFile(
    formatFilePath(lucia.signOutButtonComponent, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.updatedSignOutButton
  );

  // add server actions
  createFile(
    formatFilePath(lucia.usersActions, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    generateUserServerActions()
  );

  const authDirFiles = generateAuthDirFiles(orm, driver, provider);
  // create auth/utils.ts
  createFile(
    formatFilePath(shared.auth.authUtils, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    authDirFiles.utilsTs
  );

  // create auth/lucia.ts
  createFile(
    formatFilePath(lucia.libAuthLucia, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    authDirFiles.luciaTs
  );

  // add db schema based on orm (pulled in from config file)
  if (orm === "prisma") {
    await addLuciaToPrismaSchema();
    createFile(
      formatFilePath(shared.auth.authSchema, {
        removeExtension: false,
        prefix: "rootPath",
      }),
      `import { z } from "zod";

export const authenticationSchema = z.object({
  email: z.string().email().min(5).max(31),
  password: z
    .string()
    .min(4, { message: "must be at least 4 characters long" })
    .max(15, { message: "cannot be more than 15 characters long" }),
});

export const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().min(4).optional(),
});

export type UsernameAndPassword = z.infer<typeof authenticationSchema>;
`
    );
  }
  if (orm === "drizzle") {
    const schema = DrizzleLuciaSchema[driver];
    const schemaWithZodSchemas =
      schema +
      `\n\nexport const authenticationSchema = z.object({
  email: z.string().email().min(5).max(31),
  password: z
    .string()
    .min(4, { message: "must be at least 4 characters long" })
    .max(15, { message: "cannot be more than 15 characters long" }),
});

export const updateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().min(4).optional(),
});

export type UsernameAndPassword = z.infer<typeof authenticationSchema>;
`;
    if (provider === "planetscale") {
      const schemaWithoutReferences = schemaWithZodSchemas.replace(
        /\.references\(\(\) => user\.id\)/g,
        ""
      );
      createFile(
        formatFilePath(shared.auth.authSchema, {
          removeExtension: false,
          prefix: "rootPath",
        }),
        schemaWithoutReferences
      );
    } else {
      createFile(
        formatFilePath(shared.auth.authSchema, {
          removeExtension: false,
          prefix: "rootPath",
        }),
        schemaWithZodSchemas
      );
    }
  }

  // if using neon, add to db/index.ts
  if (provider === "neon" && orm === "drizzle") {
    const dbTsPath = formatFilePath(dbIndex, {
      prefix: "rootPath",
      removeExtension: false,
    });
    const dbTsExists = fs.existsSync(dbTsPath);
    if (!dbTsExists) return;

    const dbTsContents = fs.readFileSync(dbTsPath, {
      encoding: "utf-8",
    });
    const contentsImportsUpdated = dbTsContents.replace(
      "{ neon, neonConfig }",
      "{ neon, neonConfig, Pool }"
    );
    const contentsWithPool = contentsImportsUpdated.concat(
      "\nexport const pool = new Pool({ connectionString: env.DATABASE_URL });"
    );
    replaceFile(dbTsPath, contentsWithPool);
  }

  // install packages (lucia, and adapter) will have to pull in specific package
  const PrismaAdapterDriverMappings = generatePrismaAdapterDriverMappings();
  const DrizzleAdapterDriverMappings = generateDrizzleAdapterDriverMappings();
  const adapterPackage =
    orm === "prisma"
      ? PrismaAdapterDriverMappings.adapterPackage
      : DrizzleAdapterDriverMappings[driver][provider].adapterPackage;

  if (t3 && orm === "drizzle") {
    // replace server/db/index.ts to have connection exported
    updateDrizzleDbIndex(provider);
    // updates to make sure shcmea is included in dbindex  too
  }

  // If trpc installed, add protectedProcedure
  updateTrpcWithSessionIfInstalled();

  // update next config mjs
  addNodeRsFlagsToNextConfig();

  addToInstallList({
    regular: [
      "lucia",
      "oslo",
      "@node-rs/bcrypt",
      "@node-rs/argon2",
      adapterPackage,
    ],
    dev: [],
  });

  // add package to config
  addPackageToConfig("lucia");
  updateConfigFile({ auth: "lucia" });
  // consola.success("Successfully installed Lucia!");
};
