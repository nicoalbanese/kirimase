import { AuthType, DBType } from "../../../../types.js";
import { getFileLocations, readConfigFile } from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { AuthSubTypeMapping } from "../../utils.js";

export const generateStripeIndexTs = () => {
  return `import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
  typescript: true,
});
`;
};

export const generateStripeSubscriptionTsOld = () => {
  const { orm } = readConfigFile();
  const { stripe, shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  let userSelect: string;
  switch (orm) {
    case "drizzle":
      userSelect = `db.select().from(users).where(eq( users.id, session.user.id ))`;
      break;
    case "prisma":
      userSelect = `db.user.findFirst({
    where: {
      id: session.user.id,
    },
  });`;
  }

  return `import { storeSubscriptionPlans } from "${formatFilePath(
    stripe.configSubscription,
    { prefix: "alias", removeExtension: true },
  )}";
import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";${
    orm === "drizzle"
      ? `\nimport { users } from "${formatFilePath(shared.auth.authSchema, {
          prefix: "alias",
          removeExtension: true,
        })}";\nimport { eq } from "drizzle-orm";`
      : ""
  }
import { stripe } from "${formatFilePath(stripe.stripeIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

export async function getUserSubscriptionPlan() {
  const { session } = await getUserAuth();

  if (!session || !session.user) {
    throw new Error("User not found.");
  }

  const ${orm === "drizzle" ? "[user]" : "user"} = await ${userSelect}

  if (!user) {
    throw new Error("User not found.");
  }

  const isSubscribed =
    user.stripePriceId &&
    user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now();

  const plan = isSubscribed
    ? storeSubscriptionPlans.find(
        (plan) => plan.stripePriceId === user.stripePriceId
      )
    : null;

  let isCanceled = false;
  if (isSubscribed && user.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );
    isCanceled = stripePlan.cancel_at_period_end;
  }

  return {
    ...plan,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    stripeCustomerId: user.stripeCustomerId,
    isSubscribed,
    isCanceled,
  };
}
`;
};

export const generateConfigSubscriptionsTs = () => {
  return `export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  stripePriceId: string;
  price: number;
  features: Array<string>;
}

export const storeSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "pro",
    name: "Pro",
    description: "Pro tier that offers x, y, and z features.",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
    price: 1000,
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    id: "max",
    name: "Max",
    description: "Super Pro tier that offers x, y, and z features.",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MAX_PRICE_ID ?? "",
    price: 3000,
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    id: "ultra",
    name: "Ultra",
    description: "Ultra Pro tier that offers x, y, and z features.",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID ?? "",
    price: 5000,
    features: ["Feature 1", "Feature 2", "Feature 3"],
  },
];
`;
};

export const generateBillingCard = () => {
  const { componentLib, alias } = readConfigFile();
  const { shared } = getFilePaths();
  if (componentLib == "shadcn-ui") {
    return `"use client";
import {
  AccountCard,
  AccountCardBody,
  AccountCardFooter,
} from "./AccountCard";
import { Button } from "${alias}/components/ui/button";
import Link from "next/link";
import { AuthSession } from "${formatFilePath(shared.auth.authUtils, {
      prefix: "alias",
      removeExtension: true,
    })}";

interface PlanSettingsProps {
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  isSubscribed: boolean | "" | null;
  isCanceled: boolean;
  id?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  stripePriceId?: string | undefined;
  price?: number | undefined;
}
export default function PlanSettings({
  subscriptionPlan,
  session,
}: {
  subscriptionPlan: PlanSettingsProps;
  session: AuthSession["session"];
}) {
  return (
    <AccountCard
      params={{
        header: "Your Plan",
        description: subscriptionPlan.isSubscribed
          ? \`You are currently on the \${subscriptionPlan.name} plan.\`
          : \`You are not subscribed to any plan.\`.concat(
              !session?.user?.email || session?.user?.email.length < 5
                ? " Please add your email to upgrade your account."
                : ""
            ),
      }}
    >
      <AccountCardBody>
        {subscriptionPlan.isSubscribed ? (
          <h3 className="font-semibold text-lg">
            \${subscriptionPlan.price ? subscriptionPlan.price / 100 : 0} / month
          </h3>
        ) : null}
        {subscriptionPlan.stripeCurrentPeriodEnd ? (
          <p className="text-sm mb-4 text-muted-foreground ">
            Your plan will{" "}
            {!subscriptionPlan.isSubscribed
              ? null
              : subscriptionPlan.isCanceled
              ? "cancel"
              : "renew"}
            {" on "}
            <span className="font-semibold">
              {subscriptionPlan.stripeCurrentPeriodEnd.toLocaleDateString(
                "en-us"
              )}
            </span>
          </p>
        ) : null}
      </AccountCardBody>
      <AccountCardFooter description="Manage your subscription on Stripe.">
        <Link href="/account/billing">
          <Button variant="outline">Go to billing</Button>
        </Link>
      </AccountCardFooter>
    </AccountCard>
  );
}
`;
  } else {
    return `"use client";
import {
  AccountCard,
  AccountCardBody,
  AccountCardFooter,
} from "./AccountCard";
import Link from "next/link";

interface PlanSettingsProps {
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  isSubscribed: boolean | "" | null;
  isCanceled: boolean;
  id?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  stripePriceId?: string | undefined;
  price?: number | undefined;
}
export default function PlanSettings({
  subscriptionPlan,
  user,
}: {
  subscriptionPlan: PlanSettingsProps;
  user: { name?: string; id: string; email?: string };
}) {
  return (
    <AccountCard
      params={{
        header: "Your Plan",
        description: subscriptionPlan.isSubscribed
          ? \`You are currently on the \${subscriptionPlan.name} plan.\`
          : \`You are not subscribed to any plan.\`.concat(
              !user.email || user.email.length < 5
                ? " Please add your email to upgrade your account."
                : ""
            ),
      }}
    >
      <AccountCardBody>
        {subscriptionPlan.isSubscribed ? (
          <h3 className="font-semibold text-lg">
            \${subscriptionPlan.price ? subscriptionPlan.price / 100 : 0} / month
          </h3>
        ) : null}
        {subscriptionPlan.stripeCurrentPeriodEnd ? (
          <p className="text-sm mb-4 text-neutral-500 ">
            Your plan will{" "}
            {!subscriptionPlan.isSubscribed
              ? null
              : subscriptionPlan.isCanceled
              ? "cancel"
              : "renew"}
            {" on "}
            <span className="font-semibold">
              {subscriptionPlan.stripeCurrentPeriodEnd.toLocaleDateString(
                "en-us"
              )}
            </span>
          </p>
        ) : null}
      </AccountCardBody>
      <AccountCardFooter description="Manage your subscription on Stripe.">
        <Link href="/account/billing">
          <button className="bg-white px-3.5 py-2.5 font-medium text-sm rounded-lg border border-neutral-200 hover:bg-neutral-100">
            Go to billing
          </button>
        </Link>
      </AccountCardFooter>
    </AccountCard>
  );
}
`;
  }
};

export const generateManageSubscriptionButton = () => {
  const { componentLib, alias } = readConfigFile();
  if (componentLib === "shadcn-ui") {
    return `"use client";

import { Button } from "${alias}/components/ui/button";
import React from "react";
import { toast } from "${alias}/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ManageUserSubscriptionButtonProps {
  userId: string;
  email: string;
  isCurrentPlan: boolean;
  isSubscribed: boolean;
  stripeCustomerId?: string | null;
  stripePriceId: string;
}

export function ManageUserSubscriptionButton({
  userId,
  email,
  isCurrentPlan,
  isSubscribed,
  stripeCustomerId,
  stripePriceId,
}: ManageUserSubscriptionButtonProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/manage-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            userId,
            isSubscribed,
            isCurrentPlan,
            stripeCustomerId,
            stripePriceId,
          }),
        });
        const session: { url: string } = await res.json();
        if (session) {
          window.location.href = session.url ?? "/dashboard/billing";
        }
      } catch (err) {
        console.error((err as Error).message);
        toast({ description: "Something went wrong, please try again later." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Button
        disabled={isPending}
        className="w-full"
        variant={isCurrentPlan ? "default" : "outline"}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isCurrentPlan ? "Manage Subscription" : "Subscribe"}
      </Button>
    </form>
  );
}
`;
  } else {
    return `"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ManageUserSubscriptionButtonProps {
  userId: string;
  email: string;
  isCurrentPlan: boolean;
  isSubscribed: boolean;
  stripeCustomerId?: string | null;
  stripePriceId: string;
}

export function ManageUserSubscriptionButton({
  userId,
  email,
  isCurrentPlan,
  isSubscribed,
  stripeCustomerId,
  stripePriceId,
}: ManageUserSubscriptionButtonProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/manage-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            userId,
            isSubscribed,
            isCurrentPlan,
            stripeCustomerId,
            stripePriceId,
          }),
        });
        const session: { url: string } = await res.json();
        if (session) {
          window.location.href = session.url ?? "/dashboard/billing";
        }
      } catch (err) {
        console.error((err as Error).message);
        alert("Something went wrong, please try again later.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <button
        disabled={isPending}
        className={\`w-full \${
          isCurrentPlan
            ? "bg-neutral-900 py-2.5 px-3.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            : "text-center w-full hover:bg-neutral-100 px-3.5 py-2.5 font-medium text-sm rounded-md border border-neutral-300"
        }\`}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isCurrentPlan ? "Manage Subscription" : "Subscribe"}
      </button>
    </form>
  );
}
`;
  }
};

export const generateSuccessToast = () => {
  const { alias } = readConfigFile();
  return `"use client";

import { useToast } from "${alias}/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SuccessToast() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const success = searchParams.get("success") as Boolean | null;
  useEffect(() => {
    if (success) {
      toast({ description: "Successfully updated subscription." });
    }
  }, [success, toast]);

  return null;
}
`;
};

export const generateAccountPage = () => {
  const { shared, stripe } = getFilePaths();
  return `import UserSettings from "./UserSettings";
import PlanSettings from "./PlanSettings";
import { checkAuth, getUserAuth } from "${formatFilePath(
    shared.auth.authUtils,
    { prefix: "alias", removeExtension: true },
  )}";
import { getUserSubscriptionPlan } from "${formatFilePath(
    stripe.stripeSubscription,
    { prefix: "alias", removeExtension: true },
  )}";

export default async function Account() {
  await checkAuth();
  const { session } = await getUserAuth();
  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <main>
      <h1 className="text-3xl font-semibold my-6">Account</h1>
      <div className="space-y-6">
        <PlanSettings
          subscriptionPlan={subscriptionPlan}
          session={session}
        />
        <UserSettings session={session} />
      </div>
    </main>
  );
}
`;
};

export const generateBillingPage = () => {
  const { componentLib, alias } = readConfigFile();
  const { stripe, shared } = getFilePaths();
  if (componentLib === "shadcn-ui") {
    return `import SuccessToast from "./SuccessToast";
import { ManageUserSubscriptionButton } from "./ManageSubscription";
import { Button } from "${alias}/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "${alias}/components/ui/card";
import { storeSubscriptionPlans } from "${formatFilePath(
      stripe.configSubscription,
      { prefix: "alias", removeExtension: true },
    )}";
import { checkAuth, getUserAuth } from "${formatFilePath(
      shared.auth.authUtils,
      { prefix: "alias", removeExtension: true },
    )}";
import { getUserSubscriptionPlan } from "${formatFilePath(
      stripe.stripeSubscription,
      { prefix: "alias", removeExtension: true },
    )}";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Billing() {
  await checkAuth();
  const { session } = await getUserAuth();
  const subscriptionPlan = await getUserSubscriptionPlan();

  if (!session) return redirect("/");

  return (
    <div className="min-h-[calc(100vh-57px)] ">
      <SuccessToast />
      <Link href="/account">
        <Button variant={"link"} className="px-0">
          Back
        </Button>
      </Link>
      <h1 className="text-3xl font-semibold mb-4">Billing</h1>
      <Card className="p-6 mb-2">
        <h3 className="uppercase text-xs font-bold text-muted-foreground">
          Subscription Details
        </h3>
        <p className="text-lg font-semibold leading-none my-2">
          {subscriptionPlan.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {!subscriptionPlan.isSubscribed
            ? "You are not subscribed to any plan."
            : subscriptionPlan.isCanceled
            ? "Your plan will be canceled on "
            : "Your plan renews on "}
          {subscriptionPlan?.stripeCurrentPeriodEnd
            ? subscriptionPlan.stripeCurrentPeriodEnd.toLocaleDateString()
            : null}
        </p>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {storeSubscriptionPlans.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.name === subscriptionPlan.name ? "border-primary" : ""
            }
          >
            {plan.name === subscriptionPlan.name ? (
              <div className="w-full relative">
                <div className="text-center px-3 py-1 bg-secondary-foreground text-secondary text-xs  w-fit rounded-l-lg rounded-t-none absolute right-0 font-semibold">
                  Current Plan
                </div>
              </div>
            ) : null}
            <CardHeader className="mt-2">
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2 mb-8">
                <h3 className="font-bold">
                  <span className="text-3xl">\${plan.price / 100}</span> / month
                </h3>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={\`feature_\${i + 1}\`} className="flex gap-x-2 text-sm">
                    <CheckCircle2Icon className="text-green-400 h-5 w-5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex items-end justify-center">
              {session?.user.email ? (
                <ManageUserSubscriptionButton
                  userId={session.user.id}
                  email={session.user.email || ""}
                  stripePriceId={plan.stripePriceId}
                  stripeCustomerId={subscriptionPlan?.stripeCustomerId}
                  isSubscribed={!!subscriptionPlan.isSubscribed}
                  isCurrentPlan={subscriptionPlan?.name === plan.name}
                />
              ) : (
                <div>
                  <Link href="/account">
                    <Button className="text-center" variant="ghost">
                      Add Email to Subscribe
                    </Button>
                  </Link>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
`;
  } else {
    return `import { ManageUserSubscriptionButton } from "./ManageSubscription";
import { storeSubscriptionPlans } from "${formatFilePath(
      stripe.configSubscription,
      { prefix: "alias", removeExtension: true },
    )}";
import { checkAuth, getUserAuth } from "${formatFilePath(
      shared.auth.authUtils,
      { prefix: "alias", removeExtension: true },
    )}";
import { getUserSubscriptionPlan } from "${formatFilePath(
      stripe.stripeSubscription,
      { prefix: "alias", removeExtension: true },
    )}";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Billing() {
  await checkAuth();
  const { session } = await getUserAuth();
  const subscriptionPlan = await getUserSubscriptionPlan();

  if (!session) return redirect("/");

  return (
    <div className="min-h-[calc(100vh-57px)] ">
      <Link href="/account-no-shad">
        <button className="px-0 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible outline-none focus-visible hover:underline underline-offset-2 mb-2">
          Back
        </button>
      </Link>
      <h1 className="text-3xl font-semibold mb-4">Billing</h1>
      <div className="p-6 mb-2 rounded-lg border bg-white shadow-sm ">
        <h3 className="uppercase text-xs font-bold text-neutral-500">
          Subscription Details
        </h3>
        <p className="text-lg font-semibold leading-none my-2">
          {subscriptionPlan.name}
        </p>
        <p className="text-sm text-neutral-500">
          {!subscriptionPlan.isSubscribed
            ? "You are not subscribed to any plan."
            : subscriptionPlan.isCanceled
            ? "Your plan will be canceled on "
            : "Your plan renews on "}
          {subscriptionPlan?.stripeCurrentPeriodEnd
            ? subscriptionPlan.stripeCurrentPeriodEnd.toLocaleDateString()
            : null}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {storeSubscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={\`rounded-lg border bg-white text-neutral-900 shadow-sm  \${
              plan.name === subscriptionPlan.name
                ? "border-neutral-900"
                : "border-neutral-300"
            }\`}
          >
            {plan.name === subscriptionPlan.name ? (
              <div className="w-full relative">
                <div className="text-center px-3 py-1 bg-neutral-900 text-neutral-100 text-xs  w-fit rounded-l-lg rounded-t-none absolute right-0 font-semibold">
                  Current Plan
                </div>
              </div>
            ) : null}
            <div id="header" className="mt-2 flex flex-col space-y-1.5 p-6 ">
              <div className="text-2xl font-semibold leading-none tracking-tight">
                {plan.name}
              </div>
              <div id="description" className="text-sm text-neutral-500">
                {plan.description}
              </div>
            </div>
            <div id="card-content" className="p-6 pt-0">
              <div className="mt-2 mb-8">
                <h3 className="font-bold">
                  <span className="text-3xl">\${plan.price / 100}</span> / month
                </h3>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={\`feature_\${i + 1}\`} className="flex gap-x-2 text-sm">
                    <CheckCircle2Icon className="text-green-400 h-5 w-5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              id="card-footer"
              className="flex items-end justify-center p-6 pt-0 "
            >
              {session?.user.email ? (
                <ManageUserSubscriptionButton
                  userId={session.user.id}
                  email={session.user.email || ""}
                  stripePriceId={plan.stripePriceId}
                  stripeCustomerId={subscriptionPlan?.stripeCustomerId}
                  isSubscribed={!!subscriptionPlan.isSubscribed}
                  isCurrentPlan={subscriptionPlan?.name === plan.name}
                />
              ) : (
                <div>
                  <Link href="/account">
                    <button className="text-center w-full hover:bg-neutral-100 px-3.5 py-2.5 font-medium text-sm rounded-md">
                      Add Email to Subscribe
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
  }
};

export const generateStripeWebhookOld = () => {
  const { orm } = readConfigFile();
  const { shared, stripe } = getFilePaths();
  const dbIndex = getDbIndexPath();

  let dbCalls = { one: "", two: "", three: "" };

  switch (orm) {
    case "drizzle":
      dbCalls.one = `db.update(users).set(updatedData).where(eq(users.id, session.metadata.userId))`;
      dbCalls.two = `db.update(users).set(updatedData).where(eq(users.stripeCustomerId, session.customer))`;
      dbCalls.three = `db.update(users).set({
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        )
      }).where(eq(users.stripeSubscriptionId, subscription.id))`;
      break;
    case "prisma":
      dbCalls.one = `db.user.update({
        where: { id: session.metadata.userId },
        data: updatedData,
      });`;
      dbCalls.two = `db.user.update({
        where: { stripeCustomerId: session.customer },
        data: updatedData,
      });`;
      dbCalls.three = `db.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });`;
      break;
  }

  return `import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { stripe } from "${formatFilePath(stripe.stripeIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { headers } from "next/headers";
import type Stripe from "stripe";${
    orm === "drizzle"
      ? `\nimport { users } from "${formatFilePath(shared.auth.authSchema, {
          prefix: "alias",
          removeExtension: true,
        })}";\nimport { eq } from "drizzle-orm";`
      : ""
  }

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
    console.log(event.type);
  } catch (err) {
    return new Response(
      \`Webhook Error: \${err instanceof Error ? err.message : "Unknown Error"}\`,
      { status: 400 }
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;
  // console.log("this is the session metadata -> ", session);

  if (!session?.metadata?.userId && session.customer == null) {
    console.error("session customer", session.customer);
    console.error("no metadata for userid");
    return new Response(null, {
      status: 200,
    });
  }

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const updatedData = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    if (session?.metadata?.userId != null) {
      await ${dbCalls.one}
    } else if (
      typeof session.customer === "string" &&
      session.customer != null
    ) {
      await ${dbCalls.two}
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the price id and set the new period end.
    await ${dbCalls.three}
  }

  return new Response(null, { status: 200 });
}
`;
};

export const generateManageSubscriptionRoute = () => {
  const { stripe, shared } = getFilePaths();
  return `import { stripe } from "${formatFilePath(stripe.stripeIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { absoluteUrl } from "${formatFilePath(shared.init.libUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

interface ManageStripeSubscriptionActionProps {
  isSubscribed: boolean;
  stripeCustomerId?: string | null;
  isCurrentPlan: boolean;
  stripePriceId: string;
  email: string;
  userId: string;
}

export async function POST(req: Request) {
  const body: ManageStripeSubscriptionActionProps = await req.json();
  const { isSubscribed, stripeCustomerId, userId, stripePriceId, email } = body;
  console.log(body);
  const billingUrl = absoluteUrl("/account/billing");

  if (isSubscribed && stripeCustomerId) {
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: billingUrl,
    });

    return new Response(JSON.stringify({ url: stripeSession.url }), {
      status: 200,
    });
  }

  const stripeSession = await stripe.checkout.sessions.create({
    success_url: billingUrl.concat("?success=true"),
    cancel_url: billingUrl,
    payment_method_types: ["card"],
    mode: "subscription",
    billing_address_collection: "auto",
    customer_email: email,
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
    },
  });

  return new Response(JSON.stringify({ url: stripeSession.url }), {
    status: 200,
  });
}
`;
};

export const generateSubscriptionsDrizzleSchema = (
  driver: DBType,
  auth: AuthType,
) => {
  const authSubtype = AuthSubTypeMapping[auth];
  // add references for pg and sqlite
  switch (driver) {
    case "pg":
      return `import {
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";${
        authSubtype === "self-hosted" ? `\nimport { users } from "./auth";` : ""
      }

export const subscriptions = pgTable(
  "subscriptions",
  {
    userId: varchar("user_id", { length: 255 })
      .unique()${
        authSubtype === "self-hosted"
          ? `\n      .references(() => users.id)`
          : ""
      },
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 255,
    }).unique(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  },
  (table) => {
    return {
      pk: primaryKey(table.userId, table.stripeCustomerId),
    };
  }
);
`;
    case "mysql":
      return `import {
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    userId: varchar("user_id", { length: 255 }).unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 255,
    }).unique(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  },
  (table) => {
    return {
      pk: primaryKey(table.userId, table.stripeCustomerId),
    };
  }
);
`;
    case "sqlite":
      return `import {
  sqliteTable,
  primaryKey,
  integer,
  text
} from "drizzle-orm/sqlite-core";${
        authSubtype === "self-hosted" ? `\nimport { users } from "./auth";` : ""
      }

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    userId: text("user_id")
      .unique()${
        authSubtype === "self-hosted"
          ? `\n      .references(() => users.id)`
          : ""
      },
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    stripeCurrentPeriodEnd: integer("stripe_current_period_end", {
       mode: "timestamp",
    }),
  },
  (table) => {
    return {
      pk: primaryKey(table.userId, table.stripeCustomerId),
    };
  }
);
`;
  }
};

export const generateStripeWebhook = () => {
  const { orm } = readConfigFile();
  const { shared, stripe } = getFilePaths();
  const dbIndex = getDbIndexPath();

  let dbCalls = { one: "", two: "", three: "" };

  switch (orm) {
    case "drizzle":
      dbCalls.one = `const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.metadata.userId));
      if (sub != undefined) {
        await db
          .update(subscriptions)
          .set(updatedData)
          .where(eq(subscriptions.userId, sub.userId!));
      } else {
        await db
          .insert(subscriptions)
          .values({ ...updatedData, userId: session.metadata.userId });
      }
`;
      dbCalls.two = `await db
        .update(subscriptions)
        .set(updatedData)
        .where(eq(subscriptions.stripeCustomerId, session.customer));
`;
      dbCalls.three = `await db
      .update(subscriptions)
      .set({
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
`;
      break;
    case "prisma":
      dbCalls.one = `await db.subscription.upsert({
        where: { userId: session.metadata.userId },
        update: { ...updatedData, userId: session.metadata.userId },
        create: { ...updatedData, userId: session.metadata.userId },
      });`;
      dbCalls.two = `await db.subscription.update({
        where: { stripeCustomerId: session.customer },
        data: updatedData,
      });`;
      dbCalls.three = `await db.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });`;
      break;
  }

  return `import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { stripe } from "${formatFilePath(stripe.stripeIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { headers } from "next/headers";
import type Stripe from "stripe";${
    orm === "drizzle"
      ? `\nimport { subscriptions } from "${formatFilePath(
          stripe.subscriptionSchema,
          { prefix: "alias", removeExtension: true },
        )}";\nimport { eq } from "drizzle-orm";`
      : ""
  }

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
    console.log(event.type);
  } catch (err) {
    return new Response(
      \`Webhook Error: \${err instanceof Error ? err.message : "Unknown Error"}\`,
      { status: 400 }
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;
  // console.log("this is the session metadata -> ", session);

  if (!session?.metadata?.userId && session.customer == null) {
    console.error("session customer", session.customer);
    console.error("no metadata for userid");
    return new Response(null, {
      status: 200,
    });
  }

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    const updatedData = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    if (session?.metadata?.userId != null) {
      ${dbCalls.one}
    } else if (
      typeof session.customer === "string" &&
      session.customer != null
    ) {
      ${dbCalls.two}
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the price id and set the new period end.
    ${dbCalls.three}
  }

  return new Response(null, { status: 200 });
}
`;
};

export const generateStripeSubscriptionTs = () => {
  const { orm } = readConfigFile();
  const { stripe, shared } = getFilePaths();
  const dbIndex = getDbIndexPath();

  let subSelect: string;
  switch (orm) {
    case "drizzle":
      subSelect = `db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id));`;
      break;
    case "prisma":
      subSelect = `db.subscription.findFirst({
    where: {
      userId: session.user.id,
    },
  });`;
  }

  return `import { storeSubscriptionPlans } from "${formatFilePath(
    stripe.configSubscription,
    { prefix: "alias", removeExtension: true },
  )}";
import { db } from "${formatFilePath(dbIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";${
    orm === "drizzle"
      ? `\nimport { subscriptions } from "${formatFilePath(
          stripe.subscriptionSchema,
          { prefix: "alias", removeExtension: true },
        )}";\nimport { eq } from "drizzle-orm";`
      : ""
  }
import { stripe } from "${formatFilePath(stripe.stripeIndex, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

export async function getUserSubscriptionPlan() {
  const { session } = await getUserAuth();

  if (!session || !session.user) {
    throw new Error("User not found.");
  }

  const ${
    orm === "drizzle" ? "[ subscription ]" : "subscription"
  } = await ${subSelect}

  if (!subscription)
    return {
      id: undefined,
      name: undefined,
      description: undefined,
      stripePriceId: undefined,
      price: undefined,
      stripeSubscriptionId: null,
      stripeCurrentPeriodEnd: null,
      stripeCustomerId: null,
      isSubscribed: false,
      isCanceled: false,
    };

  const isSubscribed =
    subscription.stripePriceId &&
    subscription.stripeCurrentPeriodEnd &&
    subscription.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now();

  const plan = isSubscribed
    ? storeSubscriptionPlans.find(
        (plan) => plan.stripePriceId === subscription.stripePriceId
      )
    : null;

  let isCanceled = false;
  if (isSubscribed && subscription.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
    isCanceled = stripePlan.cancel_at_period_end;
  }

  return {
    ...plan,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCurrentPeriodEnd: subscription.stripeCurrentPeriodEnd,
    stripeCustomerId: subscription.stripeCustomerId,
    isSubscribed,
    isCanceled,
  };
}
`;
};

export const createAccountTRPCRouter = () => {
  const { alias } = readConfigFile();
  const { stripe, trpc, shared } = getFilePaths();
  const { createRouterInvokcation } = getFileLocations();
  return `import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { publicProcedure, ${createRouterInvokcation} } from "${formatFilePath(
    trpc.serverTrpc,
    { prefix: "alias", removeExtension: true },
  )}";
import { getUserSubscriptionPlan } from "${formatFilePath(
    stripe.stripeSubscription,
    { prefix: "alias", removeExtension: true },
  )}";
export const accountRouter = ${createRouterInvokcation}({
  getUser: publicProcedure.query(async () => {
    const { session } = await getUserAuth();
    return session;
  }),
  getSubscription: publicProcedure.query(async () => {
    const sub = await getUserSubscriptionPlan();
    return sub;
  }),
});
`;
};
