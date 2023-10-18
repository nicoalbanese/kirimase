import { ORMType } from "../../../../types.js";

export const createUserSettingsComponent = () => {
  return `"use client";
import UpdateNameCard from "./UpdateNameCard";
import UpdateEmailCard from "./UpdateEmailCard";

export default function UserSettings({
  user,
}: {
  user: { name?: string; email?: string };
}) {
  return (
    <>
      <UpdateNameCard name={user.name ?? ""} />
      <UpdateEmailCard email={user.email ?? ""} />
    </>
  );
}
`;
};

export const createUpdateNameCard = (withShadCn = false) => {
  if (withShadCn) {
    return `"use client";
import { AccountCard, AccountCardFooter, AccountCardBody } from "./AccountCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
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
          <Input defaultValue={name ?? ""} name="name" disabled={isPending} />
        </AccountCardBody>
        <AccountCardFooter description="64 characters maximum">
          <Button disabled={isPending}>Update Name</Button>
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
            disabled={isPending}
            className="block text-sm w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-slate-700"
          />
        </AccountCardBody>
        <AccountCardFooter description="64 characters maximum">
          <button
            className={\`bg-slate-900 py-2.5 px-3.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed\`}
            disabled={isPending}
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

export const createUpdateEmailCard = (withShadCn = false) => {
  if (withShadCn) {
    return `import { AccountCard, AccountCardFooter, AccountCardBody } from "./AccountCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
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
        toast({ description: "Successfully updated name!" });
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
          <Input defaultValue={email ?? ""} name="email" disabled={isPending} />
        </AccountCardBody>
        <AccountCardFooter description="We will email vou to verify the change.">
          <Button disabled={isPending}>Update Email</Button>
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
            disabled={isPending}
            className="block text-sm w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-slate-700"
          />
        </AccountCardBody>
        <AccountCardFooter description="We will email vou to verify the change.">
          <button
            disabled={isPending}
            className={\`bg-slate-900 py-2.5 px-3.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed\`}
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
  if (withShadCn) {
    return `import { Card } from "@/components/ui/card";

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
      className="bg-primary-foreground dark:bg-slate-900 dark:border-slate-800 p-4 border border-zinc-200 flex justify-between items-center"
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
    <div className="bg-white border-slate-200 border rounded-lg">
      <div id="body" className="p-4 ">
        <h3 className="text-xl font-semibold">{header}</h3>
        <p className="text-slate-500">{description}</p>
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
      className="bg-slate-50 p-4 border border-zinc-200 flex justify-between items-center"
      id="footer"
    >
      <p className="text-slate-500 text-sm">{description}</p>
      {children}
    </div>
  );
}
`;
  }
};

export const createAccountPage = (withStripe = false) => {
  return `import UserSettings from "./UserSettings";${
    withStripe ? '\nimport PlanSettings from "./PlanSettings";' : ""
  }
import { checkAuth, getUserAuth } from "@/lib/auth/utils";${
    withStripe
      ? '\nimport { getUserSubscriptionPlan } from "@/lib/stripe/subscription";'
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
          ? `\n        <PlanSettings
          subscriptionPlan={subscriptionPlan}
          user={session?.user!}
        />
`
          : ""
      }
        <UserSettings user={session?.user!} />
      </div>
    </main>
  );
}
`;
};

export const createAccountApiTs = (orm: ORMType) => {
  switch (orm) {
    case "drizzle":
      return `import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { revalidatePath } from "next/cache";

export async function PUT(request: Request) {
  const { session } = await getUserAuth();
  if (!session) return new Response("Error", { status: 400 });
  const body = (await request.json()) as { name?: string; email?: string };

  await db.update(users).set({ ...body });
  revalidatePath("/account");
  return new Response(JSON.stringify({ message: "ok" }), { status: 200 });
}
`;
    case "prisma":
      return `import { getUserAuth } from "@/lib/auth/utils";
import { db } from "@/lib/db";
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

export const createNavbar = (withShadcn = false) => {
  if (withShadcn) {
    return `import { getUserAuth } from "@/lib/auth/utils";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SignOutBtn from "@/components/auth/SignOutBtn";
import { ModeToggle } from "@/components/ui/ThemeToggle";

export default async function Navbar() {
  const { session } = await getUserAuth();
  const nameExists =
    !!session?.user.name &&
    session?.user.name.length > 5 &&
    session?.user.name.indexOf(" ") > 0;
  if (session?.user) {
    return (
      <nav className="py-2 flex items-center justify-between transition-all duration-300">
        <h1 className="font-semibold hover:opacity-75 transition-hover cursor-pointer">
          <Link href="/">Logo</Link>
        </h1>
        <div className="space-x-2 flex items-center">
          <ModeToggle />
          {session ? (
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
                <DropdownMenuItem>
                  <SignOutBtn />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/sign-in">Sign in</Link>
          )}
        </div>
      </nav>
    );
  } else return null;
}
`;
  } else {
    return `import { getUserAuth } from "@/lib/auth/utils";
import Link from "next/link";

export default async function Navbar() {
  const { session } = await getUserAuth();
  if (session?.user) {
    return (
      <nav className="py-2 flex items-center justify-between transition-all duration-300">
        <h1 className="font-semibold hover:opacity-75 transition-hover cursor-pointer">
          <Link href="/">Logo</Link>
        </h1>
        <Link href="/account">
          <div className="w-8 h-8 bg-slate-100 rounded-full text-slate-600 flex items-center justify-center hover:opacity-75 transition-all duration-300 cursor-pointer hover:ring-1 ring-zinc-300">
            {session?.user?.name ? session.user.name.slice(0, 1) : "~"}
          </div>
        </Link>
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
