// STRIPE
// Add attributes to user model [done]
// create stripe/index file
// create stripe/subscription file
// create config/subscriptions.ts
// add billingcard to accountpage with billing card
// create api/webhooks/route.ts
// create api/billing/manage-subscription/route.ts
// update account/page.tsx
// create account/billing/page.tsx
// add package json script [done]
// add to .env (STRIPE_SECRET_KEY,NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,STRIPE_WEBHOOK_SECRET,NEXT_PUBLIC_STRIPE_MOBILE_PRICE_ID) [done]
// install packages [done]

import path from "path";
import {
  addPackageToConfig,
  createFile,
  installPackages,
  readConfigFile,
  replaceFile,
} from "../../../../utils.js";
import { consola } from "consola";
import fs from "fs";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addToPrismaModel } from "../../../generate/utils.js";
import { addToDrizzleModel } from "../../orm/drizzle/utils.js";
import {
  generateAccountPage,
  generateBillingCard,
  generateBillingPage,
  generateConfigSubscriptionsTs,
  generateManageSubscriptionButton,
  generateManageSubscriptionRoute,
  generateStripeIndexTs,
  generateStripeSubscriptionTs,
  generateStripeWebhook,
  generateSuccessToast,
} from "./generators.js";
import { addPackage } from "../../index.js";

export const addStripe = async () => {
  const { componentLib, preferredPackageManager, rootPath, orm, driver } =
    readConfigFile();
  console.log(orm);

  if (orm === null || orm === undefined) {
    await addPackage();
    return;
  }
  // install packages
  await installPackages(
    { dev: "", regular: "stripe @stripe/stripe-js lucide-react" },
    preferredPackageManager
  );

  // add attributes to usermodel
  if (orm === "prisma") consola.box("adding to prisma schema");
  addToPrismaModel(
    "User",
    `  stripeCustomerId       String?   @unique @map(name: "stripe_customer_id")
  stripeSubscriptionId   String?   @unique @map(name: "stripe_subscription_id")
  stripePriceId          String?   @map(name: "stripe_price_id")
  stripeCurrentPeriodEnd DateTime? @map(name: "stripe_current_period_end")
`
  );
  if (orm === "drizzle") {
    let keysToAdd: string;
    let additionalCoreTypesToImport: string[];
    switch (driver) {
      case "pg":
        keysToAdd = `  
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end")
`;
        additionalCoreTypesToImport = ["timestamp"];
        break;
      case "mysql":
        keysToAdd = `  
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end")
`;
        additionalCoreTypesToImport = ["timestamp"];
        break;
      case "sqlite":
        keysToAdd = `
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  stripeCurrentPeriodEnd: integer("stripe_current_period_end", {
    mode: "timestamp",
  }),
`;
        additionalCoreTypesToImport = ["integer"];
        break;
    }

    addToDrizzleModel("users", keysToAdd, additionalCoreTypesToImport); // HERE
  }

  // create stripe/index file
  createFile(rootPath.concat("lib/stripe/index.ts"), generateStripeIndexTs());
  // create stripe/subscription file
  createFile(
    rootPath.concat("lib/stripe/subscription.ts"),
    generateStripeSubscriptionTs()
  );
  // create config/subscriptions.ts
  createFile(
    rootPath.concat("config/subscriptions.ts"),
    generateConfigSubscriptionsTs()
  );
  // components: create billing card
  createFile(
    rootPath.concat("app/account/PlanSettings.tsx"),
    generateBillingCard()
  );
  // components: create manage subscription button
  createFile(
    rootPath.concat("app/account/ManageSubscription.tsx"),
    generateManageSubscriptionButton()
  );
  // components: create success toast
  if (componentLib === "shadcn-ui")
    createFile(
      rootPath.concat("app/account/SuccessToast.tsx"),
      generateSuccessToast()
    );

  // add billingcard to accountpage with billing card TODO
  replaceFile(rootPath.concat("app/account/page.tsx"), generateAccountPage());
  // create account/billing/page.tsx
  createFile(
    rootPath.concat("app/account/billing/page.tsx"),
    generateBillingPage()
  );
  // create api/webhooks/route.ts
  createFile(
    rootPath.concat("app/api/webhooks/stripe/route.ts"),
    generateStripeWebhook()
  );
  // create api/billing/manage-subscription/route.ts
  createFile(
    rootPath.concat("app/api/billing/manage-subscription/route.ts"),
    generateManageSubscriptionRoute()
  );

  addUtilToUtilsTs(rootPath);

  // add to dotenv
  addToDotEnv(
    [
      { key: "STRIPE_SECRET_KEY", value: "" },
      { key: "STRIPE_WEBHOOK_SECRET", value: "" },
      { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", value: "", public: true },
      { key: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID", value: "", public: true },
      { key: "NEXT_PUBLIC_STRIPE_MAX_PRICE_ID", value: "", public: true },
      { key: "NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID", value: "", public: true },
    ],
    rootPath
  );

  // misc script updates
  addListenScriptToPackageJson();
  addPackageToConfig("stripe");
};

const addListenScriptToPackageJson = () => {
  // Define the path to package.json
  const packageJsonPath = path.resolve("package.json");

  // Read package.json
  const packageJsonData = fs.readFileSync(packageJsonPath, "utf-8");

  // Parse package.json content
  let packageJson = JSON.parse(packageJsonData);

  const newItems = {
    "stripe:listen":
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  };
  packageJson.scripts = {
    ...packageJson.scripts,
    ...newItems,
  };

  // Stringify the updated content
  const updatedPackageJsonData = JSON.stringify(packageJson, null, 2);

  // Write the updated content back to package.json
  fs.writeFileSync(packageJsonPath, updatedPackageJsonData);

  consola.success("Stripe listen script added to package.json");
};

const addUtilToUtilsTs = (rootPath: string) => {
  const utilContentToAdd = `export function absoluteUrl(path: string) {
  return \`\${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }\${path}\`;
}`;
  const utilsPath = rootPath.concat("lib/utils.ts");
  const utilsExist = fs.existsSync(utilsPath);
  if (utilsExist) {
    const utilsContent = fs.readFileSync(utilsPath, "utf-8");
    if (!utilsContent.includes(utilContentToAdd)) {
      const newUtilsContent = utilsContent.concat(`\n${utilContentToAdd}`);
      replaceFile(utilsPath, newUtilsContent);
    } else return;
  } else {
    createFile(utilsPath, utilContentToAdd);
  }
};
