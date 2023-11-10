export type Paths = {
  drizzle: {
    dbMigrate: string;
    migrationsDir: string;
    dbIndex: string;
    schemaTs?: string;
    schemaAggregator?: string;
  };
  prisma: { dbIndex: string };
  shared: {
    init: {
      envMjs: string;
      libUtils: string;
      globalCss: string;
    };
    orm: {
      servicesDir: string;
      schemaDir?: string;
    };
    auth: {
      authUtils: string;
      signInComponent: string;
      accountApiRoute: string;
      accountPage: string;
      userSettingsComponent: string;
      updateNameCardComponent: string;
      updateEmailCardComponent: string;
      accountCardComponent: string;
      navbarComponent: string;
      authSchema?: string;
    };
  };
  "next-auth": {
    nextAuthApiRoute: string;
    authProviderComponent: string;
    signOutButtonComponent: string;
  };
  clerk: {
    middleware: string;
    signInPage: string;
    signUpPage: string;
  };
  lucia: {
    signInPage: string;
    signUpPage: string;
    authFormComponent: string;
    signInApiRoute: string;
    signUpApiRoute: string;
    signOutApiRoute: string;
    appDTs: string;
    libAuthLucia: string;
    signOutButtonComponent: string;
  };
  kinde: {
    routeHandler: string;
  };
  trpc: {
    rootRouter: string;
    routerDir: string;
    serverTrpc: string;
    trpcApiRoute: string;
    trpcClient: string;
    trpcProvider: string;
    trpcApiTs: string;
    trpcContext: string;
    trpcUtils: string;
  };
  stripe: {
    subscriptionSchema?: string;
    stripeIndex: string;
    stripeSubscription: string;
    configSubscription: string;
    accountPlanSettingsComponent: string;
    billingManageSubscriptionComponent: string;
    billingSuccessToast: string;
    accountBillingPage: string;
    stripeWebhooksApiRoute: string;
    manageSubscriptionApiRoute: string;
    accountRouterTrpc?: string;
  };
  resend: {
    resendPage: string;
    firstEmailComponent: string;
    emailApiRoute: string;
    emailUtils: string;
    libEmailIndex: string;
  };
};
