import { ORMType } from "../../types.js";
import { readConfigFile } from "../../utils.js";
import { Paths } from "./types.js";

export const paths: { t3: Paths; normal: Paths } = {
  normal: {
    drizzle: {
      dbMigrate: "lib/db/migrate.ts",
      dbIndex: "lib/db/index.ts",
      migrationsDir: "lib/db/migrations",
    },
    shared: {
      orm: {
        servicesDir: "lib/api",
        schemaDir: "lib/db/schema",
      },
      auth: {
        authUtils: "lib/auth/utils.ts",
        accountPage: "app/(app)/account/page.tsx",
        authSchema: "lib/db/schema/auth.ts",
        accountApiRoute: "app/api/account/route.ts",
        signInComponent: "components/auth/SignIn.tsx",
        accountCardComponent: "app/(app)/account/AccountCard.tsx",
        userSettingsComponent: "app/(app)/account/UserSettings.tsx",
        updateNameCardComponent: "app/(app)/account/UpdateNameCard.tsx",
        updateEmailCardComponent: "app/(app)/account/UpdateEmailCard.tsx",
        layoutPage: "app/(auth)/layout.tsx",
      },
      init: {
        envMjs: "lib/env.mjs",
        libUtils: "lib/utils.ts",
        globalCss: "app/globals.css",
        navbarComponent: "components/Navbar.tsx",
        sidebarComponent: "components/Sidebar.tsx",
        appLayout: "app/(app)/layout.tsx",
        indexRoute: "app/page.tsx",
        dashboardRoute: "app/(app)/dashboard/page.tsx",
      },
    },
    prisma: { dbIndex: "lib/db/index.ts" },
    trpc: {
      trpcApiTs: "lib/trpc/api.ts",
      trpcUtils: "lib/trpc/utils.ts",
      rootRouter: "lib/server/routers/_app.ts",
      routerDir: "lib/server/routers",
      serverTrpc: "lib/server/trpc.ts",
      trpcClient: "lib/trpc/client.ts",
      trpcContext: "lib/trpc/context.ts",
      trpcApiRoute: "app/api/trpc/[trpc]/route.ts",
      trpcProvider: "lib/trpc/Provider.tsx",
    },
    clerk: {
      middleware: "middleware.ts",
      signInPage: "app/(auth)/sign-in/[[...sign-in]]/page.tsx",
      signUpPage: "app/(auth)/sign-up/[[...sign-in]]/page.tsx",
    },
    lucia: {
      signInPage: "app/(auth)/sign-in/page.tsx",
      signUpPage: "app/(auth)/sign-up/page.tsx",
      usersActions: "lib/actions/users.ts",
      libAuthLucia: "lib/auth/lucia.ts",
      formErrorComponent: "components/auth/AuthFormError.tsx",
      signOutButtonComponent: "components/auth/SignOutBtn.tsx",
    },
    kinde: {
      routeHandler: "app/api/auth/[kindeAuth]/route.ts",
      signInPage: "app/(auth)/sign-in/page.tsx",
    },
    resend: {
      emailUtils: "lib/email/utils.ts",
      resendPage: "app/(app)/resend/page.tsx",
      emailApiRoute: "app/api/email/route.ts",
      libEmailIndex: "lib/email/index.ts",
      firstEmailComponent: "components/emails/FirstEmail.tsx",
    },
    stripe: {
      stripeIndex: "lib/stripe/index.ts",
      accountBillingPage: "app/(app)/account/billing/page.tsx",
      configSubscription: "config/subscriptions.ts",
      stripeSubscription: "lib/stripe/subscription.ts",
      accountRouterTrpc: "lib/server/routers/account.ts",
      billingSuccessToast: "app/(app)/account/billing/SuccessToast.tsx",
      subscriptionSchema: "lib/db/schema/subscriptions.ts",
      stripeWebhooksApiRoute: "app/api/webhooks/stripe/route.ts",
      manageSubscriptionApiRoute:
        "app/api/billing/manage-subscription/route.ts",
      accountPlanSettingsComponent: "app/(app)/account/PlanSettings.tsx",
      billingManageSubscriptionComponent:
        "app/(app)/account/billing/ManageSubscription.tsx",
    },
    "next-auth": {
      signOutButtonComponent: "components/auth/SignOutBtn.tsx",
      nextAuthApiRoute: "app/api/auth/[...nextauth]/route.ts",
      authProviderComponent: "lib/auth/Provider.tsx",
      signInPage: "app/(auth)/sign-in/page.tsx",
    },
  },
  t3: {
    drizzle: {
      dbMigrate: "server/db/migrate.ts",
      schemaTs: "server/db/schema.ts",
      dbIndex: "server/db/index.ts",
      migrationsDir: "server/db/migrations",
      schemaAggregator: "server/db/schema/_root.ts",
    },
    shared: {
      orm: {
        servicesDir: "lib/api",
        schemaDir: "server/db/schema",
      },
      auth: {
        authUtils: "lib/auth/utils.ts",
        accountPage: "app/(app)/account/page.tsx",
        authSchema: "server/db/schema/auth.ts",
        accountApiRoute: "app/api/account/route.ts",
        signInComponent: "components/auth/SignIn.tsx",
        accountCardComponent: "app/(app)/account/AccountCard.tsx",
        userSettingsComponent: "app/(app)/account/UserSettings.tsx",
        updateNameCardComponent: "app/(app)/account/UpdateNameCard.tsx",
        updateEmailCardComponent: "app/(app)/account/UpdateEmailCard.tsx",
        layoutPage: "app/(auth)/layout.tsx",
      },
      init: {
        envMjs: "env.js",
        libUtils: "lib/utils.ts",
        globalCss: "styles/globals.css",
        navbarComponent: "components/Navbar.tsx",
        sidebarComponent: "components/Sidebar.tsx",
        appLayout: "app/(app)/layout.tsx",
        indexRoute: "app/page.tsx",
        dashboardRoute: "app/(app)/dashboard/page.tsx",
      },
    },
    prisma: { dbIndex: "server/db.ts" },
    trpc: {
      trpcApiTs: "trpc/server.ts",
      trpcUtils: "trpc/shared.ts",
      rootRouter: "server/api/root.ts",
      routerDir: "server/api/routers",
      serverTrpc: "server/api/trpc.ts",
      trpcClient: "trpc/react.tsx",
      trpcContext: "server/api/trpc.ts",
      trpcApiRoute: "app/api/trpc/[trpc]/route.ts",
      trpcProvider: "trpc/react.tsx",
    },
    clerk: {
      middleware: "middleware.ts",
      signInPage: "app/(auth)/sign-in/[[...sign-in]]/page.tsx",
      signUpPage: "app/(auth)/sign-up/[[...sign-in]]/page.tsx",
    },
    lucia: {
      signInPage: "app/(auth)/sign-in/page.tsx",
      signUpPage: "app/(auth)/sign-up/page.tsx",
      libAuthLucia: "lib/auth/lucia.ts",
      usersActions: "lib/actions/users.ts",
      formErrorComponent: "components/auth/AuthFormError.tsx",
      signOutButtonComponent: "components/auth/SignOutBtn.tsx",
    },
    kinde: {
      routeHandler: "app/api/auth/[kindeAuth]/route.ts",
      signInPage: "app/(auth)/sign-in/page.tsx",
    },
    resend: {
      emailUtils: "lib/email/utils.ts",
      resendPage: "app/(app)/resend/page.tsx",
      emailApiRoute: "app/api/email/route.ts",
      libEmailIndex: "lib/email/index.ts",
      firstEmailComponent: "components/emails/FirstEmail.tsx",
    },
    stripe: {
      stripeIndex: "lib/stripe/index.ts",
      accountBillingPage: "app/(app)/account/billing/page.tsx",
      configSubscription: "config/subscriptions.ts",
      stripeSubscription: "lib/stripe/subscription.ts",
      accountRouterTrpc: "server/api/routers/account.ts",
      billingSuccessToast: "app/(app)/account/billing/SuccessToast.tsx",
      subscriptionSchema: "server/db/schema/subscriptions.ts",
      stripeWebhooksApiRoute: "app/api/webhooks/stripe/route.ts",
      manageSubscriptionApiRoute:
        "app/api/billing/manage-subscription/route.ts",
      accountPlanSettingsComponent: "app/(app)/account/PlanSettings.tsx",
      billingManageSubscriptionComponent:
        "app/(app)/account/billing/ManageSubscription.tsx",
    },
    "next-auth": {
      signOutButtonComponent: "components/auth/SignOutBtn.tsx",
      nextAuthApiRoute: "app/api/auth/[...nextauth]/route.ts",
      authProviderComponent: "lib/auth/Provider.tsx",
      signInPage: "app/(auth)/sign-in/page.tsx",
    },
  },
};
export const getFilePaths = () => {
  const { t3 } = readConfigFile();
  if (t3) return paths.t3;
  else return paths.normal;
};

export function removeFileExtension(filePath: string): string {
  // Check if the filePath has an extension by looking for the last dot
  const lastDotIndex = filePath.lastIndexOf(".");

  // Ensure that the dot is not the first character (hidden files) and is not part of the directory path
  if (lastDotIndex > 0 && filePath.lastIndexOf("/") < lastDotIndex) {
    // Remove the extension
    return filePath.substring(0, lastDotIndex);
  }

  // Return the original filePath if no extension was found
  return filePath;
}

export const formatFilePath = (
  filePath: string,
  opts: {
    prefix: "alias" | "rootPath";
    removeExtension: boolean;
  }
) => {
  const { alias, rootPath } = readConfigFile();
  const formattedFP = opts.removeExtension
    ? removeFileExtension(filePath)
    : filePath;
  return `${opts.prefix === "alias" ? `${alias}/` : rootPath}${formattedFP}`;
};

export const generateServiceFileNames = (newModel: string) => {
  const { shared } = getFilePaths();
  const { rootPath } = readConfigFile();
  const rootDir = rootPath.concat(shared.orm.servicesDir);
  return {
    queriesPath: `${rootDir}/${newModel}/queries.ts`,
    mutationsPath: `${rootDir}/${newModel}/mutations.ts`,
  };
};

export const getDbIndexPath = (ormToBeInstalled?: ORMType) => {
  const { drizzle, prisma } = getFilePaths();
  const { orm: ormFromConfig } = readConfigFile();
  const orm = ormToBeInstalled ? ormToBeInstalled : ormFromConfig;
  if (orm === "prisma") return prisma.dbIndex;
  if (orm === "drizzle") return drizzle.dbIndex;
  if (!orm || orm === "null") return null;
};
