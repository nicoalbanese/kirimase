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
      navbarComponent: string;
      sidebarComponent: string;
      appLayout: string;
      indexRoute: string;
      dashboardRoute: string;
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
      layoutPage: string;
      authSchema?: string;
    };
  };
  "next-auth": {
    nextAuthApiRoute: string;
    authProviderComponent: string;
    signOutButtonComponent: string;
    signInPage: string;
  };
  clerk: {
    middleware: string;
    signInPage: string;
    signUpPage: string;
  };
  lucia: {
    signInPage: string;
    signUpPage: string;
    usersActions: string;
    libAuthLucia: string;
    signOutButtonComponent: string;
    formErrorComponent: string;
  };
  kinde: {
    routeHandler: string;
    signInPage: string;
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
