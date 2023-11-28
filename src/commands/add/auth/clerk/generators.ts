import { ComponentLibType } from "../../../../types.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

const generateMiddlewareTs = () => {
  return `import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({});

export const config = {
  matcher: ['/((?!.+\\\\\.[\\\\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};`;
};
const generateSignInPageTs = () => {
  return `import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="grid place-items-center pt-4">
      <SignIn />
    </main>
  );
}`;
};
const generateSignUpPageTs = () => {
  return `import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="grid place-items-center pt-4">
      <SignUp />
    </main>
  );
}`;
};
const homePageWithUserButton = (componentLib: ComponentLibType) => {
  const {
    shared: {
      auth: { authUtils },
    },
  } = getFilePaths();
  if (componentLib === "shadcn-ui") {
    return `import { Button } from "${formatFilePath(
      "components/ui/button.tsx",
      { prefix: "alias", removeExtension: true },
    )}";
import { getUserAuth } from "${formatFilePath(authUtils, {
      removeExtension: true,
      prefix: "alias",
    })}";
import Link from "next/link";

export default async function Home() {
  const userAuth = await getUserAuth();
  return (
    <main className="space-y-6">
      <Link href="/account">
        <Button variant="outline">Account and Billing</Button>
      </Link>
      <pre className="bg-card p-4 rounded-sm">
        {JSON.stringify(userAuth, null, 2)}
      </pre>
    </main>
  );
}
`;
  } else {
    return `import { getUserAuth } from "${formatFilePath(authUtils, {
      removeExtension: true,
      prefix: "alias",
    })}";
import Link from "next/link";

export default async function Home() {
  const userAuth = await getUserAuth();
  return (
    <main className="space-y-6">
      <Link href="/account">
        <button className="text-center hover:bg-neutral-100 border border-neutral-200 px-3.5 py-2.5 font-medium text-sm rounded-md">Account and Billing</button>
      </Link>
      <pre className="bg-neutral-100 dark:bg-neutral-800 p-4">
        {JSON.stringify(userAuth, null, 2)}
      </pre>
    </main>
  );
}
`;
  }
};
const generateAuthUtilsTs = () => {
  return `import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
    };
  } | null;
};

export const getUserAuth = async () => {
  // find out more about setting up 'sessionClaims' (custom sessions) here: https://clerk.com/docs/backend-requests/making/custom-session-token
  const { userId, sessionClaims } = auth();
  if (userId) {
    return {
      session: {
        user: {
          id: userId,
          name: \`\${sessionClaims?.firstName} \${sessionClaims?.lastName}\`,
          email: sessionClaims?.email,
        },
      },
    } as AuthSession;
  } else {
    return { session: null };
  }
};

export const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
};`;
};

export const clerkGenerators = {
  generateMiddlewareTs,
  generateSignInPageTs,
  generateSignUpPageTs,
  homePageWithUserButton,
  generateAuthUtilsTs,
};
