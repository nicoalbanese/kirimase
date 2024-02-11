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
  const {
    orm,
    provider,
    // packages,
    rootPath,
    driver,
    componentLib,
    t3,
  } = readConfigFile();

  // ask whether want to use shadcnui
  // consola.info(
  //   "Kirimase generates views and components for authenticating using Lucia."
  // );
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
  await createFile(
    formatFilePath(lucia.signInPage, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.signInPage
  );
  await createFile(
    formatFilePath(lucia.signUpPage, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.signUpPage
  );
  await createFile(
    formatFilePath(lucia.authFormComponent, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.authFormComponent
  );
  await replaceFile(
    formatFilePath(shared.init.dashboardRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    viewsAndComponents.homePage
  );
  await createFile(
    rootPath.concat("app/loading.tsx"),
    viewsAndComponents.loadingPage
  );
  // add API routes
  const apiRoutes = generateApiRoutes();
  await createFile(
    formatFilePath(lucia.signInApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoutes.signInRoute
  );
  await createFile(
    formatFilePath(lucia.signUpApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoutes.signUpRoute
  );
  await createFile(
    formatFilePath(lucia.signOutApiRoute, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    apiRoutes.signOutRoute
  );

  // add app.d.ts
  const appDTs = generateAppDTs();
  await createFile(
    formatFilePath(lucia.appDTs, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    appDTs
  );

  const authDirFiles = generateAuthDirFiles(orm, driver, provider);
  // create auth/utils.ts
  await createFile(
    formatFilePath(shared.auth.authUtils, {
      removeExtension: false,
      prefix: "rootPath",
    }),
    authDirFiles.utilsTs
  );

  // create auth/lucia.ts
  await createFile(
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
      await createFile(
        formatFilePath(shared.auth.authSchema, {
          removeExtension: false,
          prefix: "rootPath",
        }),
        schemaWithoutReferences
      );
    } else {
      await createFile(
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
    await replaceFile(dbTsPath, contentsWithPool);
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
    await updateDrizzleDbIndex(provider);
    // updates to make sure shcmea is included in dbindex  too
  }

  // If trpc installed, add protectedProcedure
  await updateTrpcWithSessionIfInstalled();

  // await installPackages(
  //   { regular: `lucia ${adapterPackage}`, dev: "" },
  //   preferredPackageManager
  // );
  addToInstallList({ regular: ["lucia@2.7.7", adapterPackage], dev: [] });

  // add package to config
  await addPackageToConfig("lucia");
  await updateConfigFile({ auth: "lucia" });
  // consola.success("Successfully installed Lucia!");
};
