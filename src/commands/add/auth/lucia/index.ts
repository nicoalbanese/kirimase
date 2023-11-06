import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { consola } from "consola";
import { luciaGenerators } from "./generators.js";
import {
  generateDrizzleAdapterDriverMappings,
  DrizzleLuciaSchema,
  generatePrismaAdapterDriverMappings,
  addLuciaToPrismaSchema,
  updateDrizzleDbIndex,
} from "./utils.js";

import fs from "fs";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { createIndexTs } from "../../orm/drizzle/generators.js";

export const addLucia = async () => {
  // get dbtype and provider
  const {
    orm,
    provider,
    preferredPackageManager,
    // packages,
    rootPath,
    driver,
    componentLib,
    t3,
  } = readConfigFile();
  // ask whether want to use shadcnui
  consola.info(
    "Kirimase generates views and components for authenticating using Lucia."
  );
  // const installShadCn = await confirm({
  //   message: "Would you like to install Shadcn-UI?",
  //   default: true,
  // });

  const {
    generateViewsAndComponents,
    generateApiRoutes,
    generateAppDTs,
    generateAuthDirFiles,
  } = luciaGenerators;

  const { lucia, shared, drizzle } = getFilePaths();
  const dbIndex = getDbIndexPath();

  // create auth form component
  // generate sign-in and sign-up pages
  let viewsAndComponents: {
    signUpPage: string;
    signInPage: string;
    authFormComponent: string;
    homePage: string;
    loadingPage: string;
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
    formatFilePath(lucia.authFormComponent, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.authFormComponent
  );
  replaceFile(rootPath.concat("app/page.tsx"), viewsAndComponents.homePage);
  createFile(
    rootPath.concat("app/loading.tsx"),
    viewsAndComponents.loadingPage
  );
  // add API routes
  const apiRoutes = generateApiRoutes();
  createFile(
    formatFilePath(lucia.signInApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoutes.signInRoute
  );
  createFile(
    formatFilePath(lucia.signUpApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoutes.signUpRoute
  );
  createFile(
    formatFilePath(lucia.signOutApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoutes.signOutRoute
  );

  // add app.d.ts
  const appDTs = generateAppDTs();
  createFile(
    formatFilePath(lucia.appDTs, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    appDTs
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
  if (orm === "prisma") await addLuciaToPrismaSchema();
  if (orm === "drizzle") {
    const schema = DrizzleLuciaSchema[driver];
    if (provider === "planetscale") {
      const schemaWithoutReferences = schema.replace(
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
        schema
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

  await installPackages(
    { regular: `lucia ${adapterPackage}`, dev: "" },
    preferredPackageManager
  );

  // add package to config
  addPackageToConfig("lucia");
  updateConfigFile({ auth: "lucia" });
  consola.success("Successfully installed Lucia!");
};
