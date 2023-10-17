import { confirm } from "@inquirer/prompts";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  installShadcnUIComponents,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { consola } from "consola";
import { installShadcnUI } from "../../componentLib/shadcn-ui/index.js";
import { luciaGenerators } from "./generators.js";
import {
  DrizzleAdapterDriverMappings,
  DrizzleLuciaSchema,
  PrismaAdapterDriverMappings,
  addLuciaToPrismaSchema,
} from "./utils.js";

import fs from "fs";

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
    await installShadcnUIComponents(["input", "label"]);
    viewsAndComponents = generateViewsAndComponents(true);
  } else {
    viewsAndComponents = generateViewsAndComponents(false);
  }
  createFile(
    rootPath.concat("app/sign-in/page.tsx"),
    viewsAndComponents.signInPage
  );
  createFile(
    rootPath.concat("app/sign-up/page.tsx"),
    viewsAndComponents.signUpPage
  );
  createFile(
    rootPath.concat("components/auth/Form.tsx"),
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
    rootPath.concat("app/api/sign-in/route.ts"),
    apiRoutes.signInRoute
  );
  createFile(
    rootPath.concat("app/api/sign-up/route.ts"),
    apiRoutes.signUpRoute
  );
  createFile(
    rootPath.concat("app/api/sign-out/route.ts"),
    apiRoutes.signOutRoute
  );

  // add app.d.ts
  const appDTs = generateAppDTs();
  createFile("app.d.ts", appDTs);

  const authDirFiles = generateAuthDirFiles(orm, driver, provider);
  // create auth/utils.ts
  createFile(rootPath.concat("lib/auth/utils.ts"), authDirFiles.utilsTs);

  // create auth/lucia.ts
  createFile(rootPath.concat("lib/auth/lucia.ts"), authDirFiles.luciaTs);

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
        rootPath.concat("lib/db/schema/auth.ts"),
        schemaWithoutReferences
      );
    } else {
      createFile(rootPath.concat("lib/db/schema/auth.ts"), schema);
    }
  }

  // if using neon, add to db/index.ts
  if (provider === "neon" && orm === "drizzle") {
    const dbTsPath = rootPath.concat("lib/db/index.ts");
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
  const adapterPackage =
    orm === "prisma"
      ? PrismaAdapterDriverMappings.adapterPackage
      : DrizzleAdapterDriverMappings[driver][provider].adapterPackage;

  await installPackages(
    { regular: `lucia ${adapterPackage}`, dev: "" },
    preferredPackageManager
  );

  // add package to config
  addPackageToConfig("lucia");
  updateConfigFile({ auth: "lucia" });
  consola.success("Successfully installed Lucia!");
};
