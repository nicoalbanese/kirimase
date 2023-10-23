// STRIPE
// Add attributes to user model [done]
// create stripe/index file [done]
// create stripe/subscription file [done]
// create config/subscriptions.ts [done]
// add billingcard to accountpage with billing card [done]
// create api/webhooks/route.ts [done]
// create api/billing/manage-subscription/route.ts [done]
// update account/page.tsx [done]
// create account/billing/page.tsx [done]
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
import {
  addToPrismaModelBulk,
  addToPrismaSchema,
} from "../../../generate/utils.js";
import {
  createAccountTRPCRouter,
  generateAccountPage,
  generateBillingCard,
  generateBillingPage,
  generateConfigSubscriptionsTs,
  generateManageSubscriptionButton,
  generateManageSubscriptionRoute,
  generateStripeIndexTs,
  generateStripeSubscriptionTs,
  generateStripeWebhook,
  generateSubscriptionsDrizzleSchema,
  generateSuccessToast,
} from "./generators.js";
import { addPackage } from "../../index.js";
import { updateClerkMiddlewareForStripe } from "../../auth/clerk/utils.js";
import { AvailablePackage } from "../../../../types.js";
import { updateTRPCRouter } from "../../../generate/generators/trpcRoute.js";
import { createAccountPage } from "../../auth/shared/generators.js";

export const addStripe = async (packagesBeingInstalled: AvailablePackage[]) => {
  const {
    componentLib,
    preferredPackageManager,
    rootPath,
    orm,
    driver,
    auth,
    packages: installedPackages,
  } = readConfigFile();

  const packages = packagesBeingInstalled.concat(installedPackages);

  if (orm === null || orm === undefined) {
    await addPackage();
    return;
  }
  // install packages
  await installPackages(
    { dev: "", regular: "stripe @stripe/stripe-js lucide-react" },
    preferredPackageManager
  );

  if (auth === "clerk") {
    updateClerkMiddlewareForStripe(rootPath);
  }

  // add attributes to usermodel
  if (orm === "prisma") {
    addToPrismaSchema(
      `model Subscription {
  userId                 String    @unique${
    auth !== "clerk"
      ? `\n  user                   User      @relation(fields: [userId], references: [id])`
      : ""
  }
  stripeCustomerId       String    @unique @map(name: "stripe_customer_id")
  stripeSubscriptionId   String?   @unique @map(name: "stripe_subscription_id")
  stripePriceId          String?   @map(name: "stripe_price_id")
  stripeCurrentPeriodEnd DateTime? @map(name: "stripe_current_period_end")

  @@id([userId, stripeCustomerId])
}
`,
      "Subscription"
    );
    if (auth !== "clerk") {
      addToPrismaModelBulk("User", "\n  subscription Subscription?");
    }
  }
  if (orm === "drizzle") {
    //     let keysToAdd: string;
    //     let additionalCoreTypesToImport: string[];
    //     switch (driver) {
    //       case "pg":
    //         keysToAdd = `
    //   stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
    //   stripeSubscriptionId: varchar("stripe_subscription_id", {
    //     length: 255,
    //   }).unique(),
    //   stripePriceId: varchar("stripe_price_id", { length: 255 }),
    //   stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
    // `;
    //         additionalCoreTypesToImport = ["timestamp"];
    //         break;
    //       case "mysql":
    //         keysToAdd = `
    //   stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
    //   stripeSubscriptionId: varchar("stripe_subscription_id", {
    //     length: 255,
    //   }).unique(),
    //   stripePriceId: varchar("stripe_price_id", { length: 255 }),
    //   stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
    // `;
    //         additionalCoreTypesToImport = ["timestamp"];
    //         break;
    //       case "sqlite":
    //         keysToAdd = `
    //   stripeCustomerId: text("stripe_customer_id").unique(),
    //   stripeSubscriptionId: text("stripe_subscription_id").unique(),
    //   stripePriceId: text("stripe_price_id"),
    //   stripeCurrentPeriodEnd: integer("stripe_current_period_end", {
    //     mode: "timestamp",
    //   }),
    // `;
    //         additionalCoreTypesToImport = ["integer"];
    //         break;
    //     }
    //
    //     addToDrizzleModel("users", keysToAdd, additionalCoreTypesToImport); // HERE
    createFile(
      rootPath.concat("lib/db/schema/subscriptions.ts"),
      generateSubscriptionsDrizzleSchema(driver, auth)
    );
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
    rootPath.concat("app/account/billing/ManageSubscription.tsx"),
    generateManageSubscriptionButton()
  );
  // components: create success toast
  if (componentLib === "shadcn-ui")
    createFile(
      rootPath.concat("app/account/billing/SuccessToast.tsx"),
      generateSuccessToast()
    );

  // add billingcard to accountpage with billing card TODO
  replaceFile(rootPath.concat("app/account/page.tsx"), createAccountPage(true));
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

  if (packages.includes("trpc")) {
    createFile(
      rootPath.concat("lib/server/routers/account.ts"),
      createAccountTRPCRouter()
    );
    // add to main trpc router
    updateTRPCRouter("account");
  }
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
