import { AuthType, ORMType } from "../../../../types.js";
import { readConfigFile } from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";

export const createUserSettingsComponent = () => {
  const { shared } = getFilePaths();
  return `"use client";
import UpdateNameCard from "./UpdateNameCard";
import UpdateEmailCard from "./UpdateEmailCard";
import { AuthSession } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

export default function UserSettings({
  session,
}: {
  session: AuthSession["session"];
}) {
  return (
    <>
      <UpdateNameCard name={session?.user.name ?? ""} />
      <UpdateEmailCard email={session?.user.email ?? ""} />
    </>
  );
}
`;
};

export const createUpdateNameCard = (withShadCn = false, disabled = false) => {
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `"use client";
import { AccountCard, AccountCardFooter, AccountCardBody } from "./AccountCard";
import { Button } from "${alias}/components/ui/button";
import { Input } from "${alias}/components/ui/input";
import { useToast } from "${alias}/components/ui/use-toast";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UpdateNameCard({ name }: { name: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const form = new FormData(target);
    const { name } = Object.fromEntries(form.entries()) as { name: string };
    if (name.length < 3) {
      toast({
        description: "Name must be longer than 3 characters.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200)
        toast({ description: "Successfully updated name!" });
      router.refresh();
    });
  };

  return (
    <AccountCard
      params={{
        header: "Your Name",
        description:
          "Please enter your full name, or a display name you are comfortable with.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <AccountCardBody>
          <Input defaultValue={name ?? ""} name="name" disabled={${
            disabled ? "true" : "isPending"
          }} />
        </AccountCardBody>
        <AccountCardFooter description="64 characters maximum">
          <Button disabled={${
            disabled ? "true" : "isPending"
          }}>Update Name</Button>
        </AccountCardFooter>
      </form>
    </AccountCard>
  );
}
`;
  } else {
    return `"use client";
import { AccountCard, AccountCardFooter, AccountCardBody } from "./AccountCard";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UpdateNameCard({ name }: { name: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const form = new FormData(target);
    const { name } = Object.fromEntries(form.entries()) as { name: string };

    startTransition(async () => {
      const res = await fetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200) alert("Successfully updated name!");
      router.refresh();
    });
  };

  return (
    <AccountCard
      params={{
        header: "Your Name",
        description:
          "Please enter your full name, or a display name you are comfortable with.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <AccountCardBody>
          <input
            defaultValue={name ?? ""}
            name="name"
            disabled={${disabled ? "true" : "isPending"}}
            className="block text-sm w-full px-3 py-2 rounded-md border border-neutral-200 focus:outline-neutral-700"
          />
        </AccountCardBody>
        <AccountCardFooter description="64 characters maximum">
          <button
            className={\`bg-neutral-900 py-2.5 px-3.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed\`}
            disabled={${disabled ? "true" : "isPending"}}
          >
            Update Name
          </button>
        </AccountCardFooter>
      </form>
    </AccountCard>
  );
}
`;
  }
};

export const createUpdateEmailCard = (withShadCn = false, disabled = false) => {
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `import { AccountCard, AccountCardFooter, AccountCardBody } from "./AccountCard";
import { Button } from "${alias}/components/ui/button";
import { Input } from "${alias}/components/ui/input";
import { useToast } from "${alias}/components/ui/use-toast";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UpdateEmailCard({ email }: { email: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const form = new FormData(target);
    const { email } = Object.fromEntries(form.entries()) as { email: string };
    if (email.length < 3) {
      toast({
        description: "Email must be longer than 3 characters.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200)
        toast({ description: "Successfully updated email!" });
      router.refresh();
    });
  };

  return (
    <AccountCard
      params={{
        header: "Your Email",
        description:
          "Please enter the email address you want to use with your account.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <AccountCardBody>
          <Input defaultValue={email ?? ""} name="email" disabled={${
            disabled ? "true" : "isPending"
          }} />
        </AccountCardBody>
        <AccountCardFooter description="We will email vou to verify the change.">
          <Button disabled={${
            disabled ? "true" : "isPending"
          }}>Update Email</Button>
        </AccountCardFooter>
      </form>
    </AccountCard>
  );
}
`;
  } else {
    return `import { AccountCard, AccountCardFooter, AccountCardBody } from "./AccountCard";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UpdateEmailCard({ email }: { email: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const form = new FormData(target);
    const { email } = Object.fromEntries(form.entries()) as { email: string };

    startTransition(async () => {
      const res = await fetch("/api/account", {
        method: "PUT",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200) alert("Successfully updated email!");
      router.refresh();
    });
  };

  return (
    <AccountCard
      params={{
        header: "Your Email",
        description:
          "Please enter the email address you want to use with your account.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <AccountCardBody>
          <input
            defaultValue={email ?? ""}
            name="email"
            disabled={${disabled ? "true" : "isPending"}}
            className="block text-sm w-full px-3 py-2 rounded-md border border-neutral-200 focus:outline-neutral-700"
          />
        </AccountCardBody>
        <AccountCardFooter description="We will email vou to verify the change.">
          <button
            disabled={${disabled ? "true" : "isPending"}}
            className={\`bg-neutral-900 py-2.5 px-3.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed\`}
          >
            Update Email
          </button>
        </AccountCardFooter>
      </form>
    </AccountCard>
  );
}
`;
  }
};

export const createAccountCardComponent = (withShadCn = false) => {
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `import { Card } from "${alias}/components/ui/card";

interface AccountCardProps {
  params: {
    header: string;
    description: string;
    price?: number;
  };
  children: React.ReactNode;
}

export function AccountCard({ params, children }: AccountCardProps) {
  const { header, description } = params;
  return (
    <Card>
      <div id="body" className="p-4 ">
        <h3 className="text-xl font-semibold">{header}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function AccountCardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

export function AccountCardFooter({
  description,
  children,
}: {
  children: React.ReactNode;
  description: string;
}) {
  return (
    <div
      className="bg-muted p-4 border dark:bg-card flex justify-between items-center rounded-b-lg"
      id="footer"
    >
      <p className="text-muted-foreground text-sm">{description}</p>
      {children}
    </div>
  );
}
`;
  } else {
    return `interface AccountCardProps {
  params: {
    header: string;
    description: string;
    price?: number;
  };
  children: React.ReactNode;
}

export function AccountCard({ params, children }: AccountCardProps) {
  const { header, description } = params;
  return (
    <div className="bg-white border-neutral-200 border rounded-lg">
      <div id="body" className="p-4 ">
        <h3 className="text-xl font-semibold">{header}</h3>
        <p className="text-neutral-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function AccountCardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

export function AccountCardFooter({
  description,
  children,
}: {
  children: React.ReactNode;
  description: string;
}) {
  return (
    <div
      className="bg-neutral-50 p-4 border border-neutral-200 flex justify-between items-center rounded-b-lg"
      id="footer"
    >
      <p className="text-neutral-500 text-sm">{description}</p>
      {children}
    </div>
  );
}
`;
  }
};

export const createAccountPage = (withStripe = false) => {
  const { shared, stripe } = getFilePaths();
  return `import UserSettings from "./UserSettings";${
    withStripe ? '\nimport PlanSettings from "./PlanSettings";' : ""
  }
import { checkAuth, getUserAuth } from "${formatFilePath(
    shared.auth.authUtils,
    { prefix: "alias", removeExtension: true },
  )}";${
    withStripe
      ? `\nimport { getUserSubscriptionPlan } from "${formatFilePath(
          stripe.stripeSubscription,
          { prefix: "alias", removeExtension: true },
        )}";`
      : ""
  }

export default async function Account() {
  await checkAuth();
  const { session } = await getUserAuth();${
    withStripe
      ? "\n  const subscriptionPlan = await getUserSubscriptionPlan();"
      : ""
  }
  
  return (
    <main>
      <h1 className="text-3xl font-semibold my-6">Account</h1>
      <div className="space-y-6">${
        withStripe
          ? `\n        <PlanSettings subscriptionPlan={subscriptionPlan} session={session} />`
          : ""
      }
        <UserSettings session={session} />
      </div>
    </main>
  );
}
`;
};

export const createAccountApiTs = (orm: ORMType) => {
  const { shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  switch (orm) {
    case "drizzle":
      return `import { getUserAuth } from "${formatFilePath(
        shared.auth.authUtils,
        { prefix: "alias", removeExtension: true },
      )}";
import { db } from "${formatFilePath(dbIndex, {
        prefix: "alias",
        removeExtension: true,
      })}";
import { users } from "${formatFilePath(shared.auth.authSchema, {
        prefix: "alias",
        removeExtension: true,
      })}";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request) {
  const { session } = await getUserAuth();
  if (!session) return new Response("Error", { status: 400 });
  const body = (await request.json()) as { name?: string; email?: string };

  await db.update(users).set({ ...body }).where(eq(users.id, session.user.id));
  revalidatePath("/account");
  return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
}
`;
    case "prisma":
      return `import { getUserAuth } from "${formatFilePath(
        shared.auth.authUtils,
        { prefix: "alias", removeExtension: true },
      )}";
import { db } from "${formatFilePath(dbIndex, {
        prefix: "alias",
        removeExtension: true,
      })}";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request) {
  const { session } = await getUserAuth();
  if (!session) return new Response("Error", { status: 400 });
  const body = (await request.json()) as { name?: string; email?: string };

  await db.user.update({ where: { id: session.user.id }, data: { ...body } });
  revalidatePath("/account");
  return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
}
`;
    default:
      break;
  }
};

export const createNavbar = (
  withShadcn: boolean,
  usingClerk = false,
  auth: AuthType,
) => {
  const { shared, "next-auth": nextAuth } = getFilePaths();
  const { alias } = readConfigFile();
  let logOutRoute: string;
  switch (auth) {
    case "next-auth":
      logOutRoute = "/api/auth/signout";
      break;
    case "clerk":
      break;
    case "lucia":
      break;
    case "kinde":
      logOutRoute = "/api/auth/logout";
      break;
  }
  if (withShadcn) {
    return `import { getUserAuth } from "${formatFilePath(
      shared.auth.authUtils,
      { prefix: "alias", removeExtension: true },
    )}";
import Link from "next/link";${
      usingClerk
        ? '\nimport { UserButton } from "@clerk/nextjs";'
        : `\nimport {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "${alias}/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "${alias}/components/ui/avatar";${
            auth === "next-auth"
              ? ""
              : `\nimport SignOutBtn from "${formatFilePath(
                  nextAuth.signOutButtonComponent,
                  { prefix: "alias", removeExtension: true },
                )}";`
          }
`
    }
import { ModeToggle } from "${alias}/components/ui/ThemeToggle";

export default async function Navbar() {
  const { session } = await getUserAuth();${
    usingClerk
      ? ""
      : `\n  const nameExists =
    !!session?.user.name &&
    session?.user.name.length > 5;
`
  }

  if (session?.user) {
    return (
      <div className="bg-popover border-b mb-2 md:p-0 px-4">
      <nav className="py-2 flex items-center justify-between transition-all duration-300 max-w-3xl mx-auto">
        <h1 className="font-semibold hover:opacity-75 transition-hover cursor-pointer">
          <Link href="/">Logo</Link>
        </h1>
        <div className="space-x-2 flex items-center">
          <ModeToggle />${
            usingClerk
              ? `\n          <UserButton afterSignOutUrl="/" />`
              : `\n          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarFallback>
                    {nameExists
                      ? session.user.name
                          ?.split(" ")
                          .map((word) => word[0].toUpperCase())
                          .join("")
                      : "~"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="font-semibold">
                    {nameExists ? session.user.name : "New User"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/account">
                  <DropdownMenuItem className="cursor-pointer">
                    Account
                  </DropdownMenuItem>
                </Link>
                ${
                  auth === "next-auth" || auth === "kinde"
                    ? `<Link href="${logOutRoute}">
                  <DropdownMenuItem className="cursor-pointer">
                    Sign out
                  </DropdownMenuItem>
                </Link>`
                    : `<DropdownMenuItem>
                  <SignOutBtn />  
                </DropdownMenuItem>`
                }
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/sign-in">Sign in</Link>
          )}
`
          }
        </div>
      </nav>
      </div>
    );
  } else return null;
}
`;
  } else {
    return `import { getUserAuth } from "${formatFilePath(
      shared.auth.authUtils,
      { prefix: "alias", removeExtension: true },
    )}";
import Link from "next/link";${
      usingClerk ? `\nimport { UserButton } from "@clerk/nextjs";` : ""
    }

export default async function Navbar() {
  const { session } = await getUserAuth();
  if (session?.user) {
    return (
      <nav className="py-2 flex items-center justify-between transition-all duration-300">
        <h1 className="font-semibold hover:opacity-75 transition-hover cursor-pointer">
          <Link href="/">Logo</Link>
        </h1>
        ${
          usingClerk
            ? `<UserButton afterSignOutUrl="/" />`
            : `<Link href="/account">
          <div className="w-8 h-8 bg-neutral-100 rounded-full text-neutral-600 flex items-center justify-center hover:opacity-75 transition-all duration-300 cursor-pointer hover:ring-1 ring-neutral-300">
            {session?.user?.name ? session.user.name.slice(0, 1) : "~"}
          </div>
        </Link>`
        }
      </nav>
    );
  } else return null;
}
`;
  }
};

export const createSignOutBtn = () => {
  return `"use client";

import { useRouter } from "next/navigation";

export default function SignOutBtn() {
  const router = useRouter();
  const handleSignOut = async () => {
    const response = await fetch("/api/sign-out", {
      method: "POST",
      redirect: "manual",
    });

    if (response.status === 0) {
      // redirected
      // when using \`redirect: "manual"\`, response status 0 is returned
      return router.refresh();
    }
  };
  return (
    <button onClick={handleSignOut} className="w-full text-left">
      Sign out
    </button>
  );
}
`;
};
