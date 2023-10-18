// STRIPE
// Add attributes to user model
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
  installPackages,
  readConfigFile,
} from "../../../../utils.js";
import { consola } from "consola";
import fs from "fs";
import { addToDotEnv } from "../../orm/drizzle/generators.js";
import { addToPrismaModel } from "../../../generate/utils.js";
import { addToDrizzleModel } from "../../orm/drizzle/utils.js";

export const addStripe = async () => {
  const { componentLib, preferredPackageManager, rootPath, orm } =
    readConfigFile();

  // install packages
  await installPackages(
    { dev: "", regular: "stripe @stripe/stripe-js" },
    preferredPackageManager
  );

  // add attributes to usermodel

  if (orm === "prisma")
    addToPrismaModel(
      "users",
      `  stripeCustomerId       String?   @unique @map(name: "stripe_customer_id")
  stripeSubscriptionId   String?   @unique @map(name: "stripe_subscription_id")
  stripePriceId          String?   @map(name: "stripe_price_id")
  stripeCurrentPeriodEnd DateTime? @map(name: "stripe_current_period_end")
`
    );
  if (orm === "drizzle") {
    addToDrizzleModel("users"); // HERE
  }

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
