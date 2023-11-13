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
  getFileLocations,
  installPackages,
  readConfigFile,
  replaceFile,
  updateConfigFile,
} from "../../../../utils.js";
import { consola } from "consola";
import fs, { existsSync } from "fs";
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
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import { libAuthUtilsTsWithoutAuthOptions } from "../../auth/next-auth/generators.js";
import { updateRootSchema } from "../../../generate/generators/model/utils.js";
import { AuthSubTypeMapping } from "../../utils.js";

export const addStripe = async (packagesBeingInstalled: AvailablePackage[]) => {
  const {
    componentLib,
    preferredPackageManager,
    rootPath,
    orm,
    driver,
    auth,
    packages: installedPackages,
    t3,
  } = readConfigFile();
  const { stripe, shared } = getFilePaths();

  const packages = packagesBeingInstalled.concat(installedPackages);
  const authSubtype = AuthSubTypeMapping[auth];

  if (orm === null || orm === undefined || driver === undefined) {
    consola.warn("You cannot install Stripe without an ORM installed.");
    updateConfigFile({ orm: undefined });
    await addPackage();
    return;
  }
  if (t3 && auth === "next-auth") {
    const authUtilsPath = formatFilePath(shared.auth.authUtils, {
      prefix: "rootPath",
      removeExtension: false,
    });

    const authUtilsExist = existsSync(authUtilsPath);
    if (!authUtilsExist) {
      createFile(authUtilsPath, libAuthUtilsTsWithoutAuthOptions());
    }
  }

  if (auth === "clerk") {
    updateClerkMiddlewareForStripe(rootPath);
  }

  // add attributes to usermodel
  if (orm === "prisma") {
    addToPrismaSchema(
      `model Subscription {
  userId                 String    @unique${
    authSubtype !== "managed"
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
    if (authSubtype !== "managed") {
      addToPrismaModelBulk("User", "\n  subscription Subscription?");
    }
  }
  if (orm === "drizzle") {
    createFile(
      formatFilePath(stripe.subscriptionSchema, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSubscriptionsDrizzleSchema(driver, auth)
    );
    if (t3) {
      updateRootSchema("subscriptions");
    }
  }

  // create stripe/index file
  createFile(
    formatFilePath(stripe.stripeIndex, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateStripeIndexTs()
  );
  // create stripe/subscription file
  createFile(
    formatFilePath(stripe.stripeSubscription, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateStripeSubscriptionTs()
  );
  // create config/subscriptions.ts
  createFile(
    formatFilePath(stripe.configSubscription, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateConfigSubscriptionsTs()
  );
  // components: create billing card
  createFile(
    formatFilePath(stripe.accountPlanSettingsComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateBillingCard()
  );
  // components: create manage subscription button
  createFile(
    formatFilePath(stripe.billingManageSubscriptionComponent, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateManageSubscriptionButton()
  );
  // components: create success toast
  if (componentLib === "shadcn-ui")
    createFile(
      formatFilePath(stripe.billingSuccessToast, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      generateSuccessToast()
    );

  // add billingcard to accountpage with billing card TODO
  replaceFile(
    formatFilePath(shared.auth.accountPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    createAccountPage(true)
  );
  // create account/billing/page.tsx
  createFile(
    formatFilePath(stripe.accountBillingPage, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateBillingPage()
  );
  // create api/webhooks/route.ts
  createFile(
    formatFilePath(stripe.stripeWebhooksApiRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
    generateStripeWebhook()
  );
  // create api/billing/manage-subscription/route.ts
  createFile(
    formatFilePath(stripe.manageSubscriptionApiRoute, {
      prefix: "rootPath",
      removeExtension: false,
    }),
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
  // install packages
  await installPackages(
    { dev: "", regular: "stripe @stripe/stripe-js lucide-react" },
    preferredPackageManager
  );
  addPackageToConfig("stripe");

  if (packages.includes("trpc")) {
    createFile(
      formatFilePath(stripe.accountRouterTrpc, {
        removeExtension: false,
        prefix: "rootPath",
      }),
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
  replaceFile(packageJsonPath, updatedPackageJsonData);

  consola.success("Stripe listen script added to package.json");
};

const addUtilToUtilsTs = (rootPath: string) => {
  const { shared } = getFilePaths();
  const utilContentToAdd = `export function absoluteUrl(path: string) {
  return \`\${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }\${path}\`;
}`;
  const utilsPath = formatFilePath(shared.init.libUtils, {
    prefix: "rootPath",
    removeExtension: false,
  });
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
