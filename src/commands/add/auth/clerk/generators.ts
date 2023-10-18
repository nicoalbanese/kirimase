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
const homePageWithUserButton = () => {
  return `import { getUserAuth } from "@/lib/auth/utils";

export default async function Home() {
  const userAuth = await getUserAuth();
  return (
    <main className="">
      <pre>{JSON.stringify(userAuth, null, 2)}</pre>
    </main>
  );
}
`;
};
const generateAuthUtilsTs = () => {
  return `import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
    };
  } | null;
};

export const getUserAuth = async () => {
  const { userId } = auth();
  if (userId) {
    return {
      session: {
        user: {
          id: userId,
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
