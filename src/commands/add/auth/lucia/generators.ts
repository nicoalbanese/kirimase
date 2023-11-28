import { DBProvider, DBType, ORMType } from "../../../../types.js";
import { readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";
import {
  generateDrizzleAdapterDriverMappings,
  LuciaAdapterInfo,
  generatePrismaAdapterDriverMappings,
} from "./utils.js";

const generateViewsAndComponents = (withShadCn: boolean) => {
  const signUpPage = generateSignUpPage(withShadCn);
  const signInPage = generateSignInPage(withShadCn);
  const authFormComponent = generateAuthFormComponent(withShadCn);
  const homePage = generateHomePage();
  const loadingPage = generateLoadingPage();
  return { signUpPage, signInPage, authFormComponent, homePage, loadingPage };
};
export const generateLoadingPage = () => {
  const { componentLib } = readConfigFile();
  const withShadCn = componentLib === "shadcn-ui";
  return `export default function Loading() {
  return (
    <div className="grid place-items-center animate-pulse ${
      withShadCn ? "text-muted-foreground" : "text-neutral-300"
    } p-4">
      <div role="status">
        <svg
          aria-hidden="true"
          className="w-8 h-8 ${
            withShadCn
              ? "text-muted-foreground fill-muted"
              : "text-neutral-200 dark:text-neutral-600 fill-neutral-600"
          } animate-spin"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
`;
};
const generateSignUpPage = (withShadCn: boolean) => {
  const { lucia, shared } = getFilePaths();
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `import AuthForm from "${formatFilePath(lucia.authFormComponent, {
      removeExtension: true,
      prefix: "alias",
    })}";
import Link from "next/link"; 
import { getPageSession } from "${formatFilePath(lucia.libAuthLucia, {
      prefix: "alias",
      removeExtension: true,
    })}";
import { redirect } from "next/navigation";
import { Input } from "${alias}/components/ui/input";
import { Label } from "${alias}/components/ui/label";

const Page = async () => {
  const session = await getPageSession();
  if (session) redirect("/");
  return (
    <main className="max-w-lg mx-auto my-4 bg-card p-10">
      <h1 className="text-2xl font-bold text-center">Create an account</h1>
      <AuthForm action="/api/sign-up">
        <Label htmlFor="username" className="text-muted-foreground">
          Username
        </Label>
        <Input name="username" id="username" />
        <br />
        <Label htmlFor="password" className="text-muted-foreground">
          Password
        </Label>
        <Input type="password" name="password" id="password" />
        <br />
      </AuthForm>
      <div className="mt-4 text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-secondary-foreground underline">
          Sign in
        </Link>
      </div>
    </main>
  );
};

export default Page;
`;
  } else {
    return `import AuthForm from "${formatFilePath(lucia.authFormComponent, {
      removeExtension: true,
      prefix: "alias",
    })}";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
      prefix: "alias",
      removeExtension: true,
    })}";

const Page = async () => {
  const { session } = await getUserAuth();
  if (session) redirect("/");
  return (
    <main className="max-w-lg mx-auto my-4 bg-neutral-100 p-10">
      <h1 className="text-2xl font-bold text-center">Create an account</h1>
      <AuthForm action="/api/sign-up">
        <label
          htmlFor="username"
          className="block font-medium text-sm text-neutral-500"
        >
          Username
        </label>
        <input
          name="username"
          id="username"
          className="block w-full px-3 py-2 rounded-md border border-neutral-200 focus:outline-neutral-700"
        />
        <br />
        <label
          htmlFor="password"
          className="block font-medium text-sm text-neutral-500"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          className="block w-full px-3 py-2 rounded-md border border-neutral-200 focus:outline-neutral-700"
        />
        <br />
      </AuthForm>
      <div className="mt-4 text-neutral-500 text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-black underline hover:opacity-70">
          Sign in
        </Link>
      </div>
    </main>
  );
};

export default Page;
`;
  }
};

const generateSignInPage = (withShadCn: boolean) => {
  const { lucia, shared } = getFilePaths();
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `import AuthForm from "${formatFilePath(lucia.authFormComponent, {
      removeExtension: true,
      prefix: "alias",
    })}";
import { Input } from "${alias}/components/ui/input";
import { Label } from "${alias}/components/ui/label";
import { getPageSession } from "${formatFilePath(lucia.libAuthLucia, {
      prefix: "alias",
      removeExtension: true,
    })}";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await getPageSession();
  if (session?.user) redirect("/");
  return (
    <main className="max-w-lg mx-auto my-4 bg-card p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <AuthForm action="/api/sign-in">
        <Label htmlFor="username" className="text-muted-foreground">
          Username
        </Label>
        <Input name="username" id="username" />
        <br />
        <Label htmlFor="password" className="text-muted-foreground">
          Password
        </Label>
        <Input type="password" name="password" id="password" />
        <br />
      </AuthForm>
      <div className="mt-4 text-sm text-center text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <Link
          href="/sign-up"
          className="text-accent-foreground underline hover:text-primary"
        >
          Create an account
        </Link>
      </div>
    </main>
  );
};

export default Page;
`;
  } else {
    return `import AuthForm from "${formatFilePath(lucia.authFormComponent, {
      removeExtension: true,
      prefix: "alias",
    })}";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
      prefix: "alias",
      removeExtension: true,
    })}";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const { session } = await getUserAuth();
  if (session?.user) redirect("/");
  return (
    <main className="max-w-lg mx-auto my-4 bg-neutral-100 p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <AuthForm action="/api/sign-in">
        <label
          htmlFor="username"
          className="block font-medium text-sm text-neutral-500"
        >
          Username
        </label>
        <input
          name="username"
          id="username"
          className="block w-full px-3 py-2 rounded-md border border-neutral-200 focus:outline-neutral-700"
        />
        <br />
        <label
          htmlFor="password"
          className="block font-medium text-sm text-neutral-500"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          className="block w-full px-3 py-2 rounded-md border border-neutral-200 focus:outline-neutral-700"
        />
        <br />
      </AuthForm>
      <div className="mt-4 text-sm text-center text-neutral-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/sign-up" className="text-black underline hover:opacity-70">
          Create an account
        </Link>
      </div>
    </main>
  );
};

export default Page;
`;
  }
};

const generateAuthFormComponent = (withShadCn: boolean) => {
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "${alias}/components/ui/button";

type Action = "/api/sign-in" | "/api/sign-up" | "/api/sign-out";

const AuthForm = ({
  children,
  action,
}: {
  children?: React.ReactNode;
  action: Action;
}) => {
  const router = useRouter();
  const [errors, setErrors] = useState<{ error: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      action={action}
      method="post"
      className="mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);
        const formData = new FormData(e.currentTarget);
        const response = await fetch(action, {
          method: "POST",
          body: formData,
          redirect: "manual",
        });

        if (response.status === 0) {
          // redirected
          // when using \`redirect: "manual"\`, response status 0 is returned
          return router.refresh();
        }
        setErrors(await response.json());
        setLoading(false);
      }}
    >
      {errors ? (
        <div className="bg-red-100 p-3 my-4">
          <h3 className="font-bold text-md">Error!</h3>
          <p className="text-sm">{errors.error}</p>
        </div>
      ) : null}
      {children}
      <SubmitButton action={action} loading={loading} />
    </form>
  );
};

export default AuthForm;

const SubmitButton = ({
  action,
  loading,
}: {
  action: Action;
  loading: boolean;
}) => {
  let buttonSuffix = "";
  switch (action) {
    case "/api/sign-in":
      buttonSuffix = "in";
      break;
    case "/api/sign-out":
      buttonSuffix = "out";
      break;
    case "/api/sign-up":
      buttonSuffix = "up";
      break;
  }
  return (
    <Button
      type="submit"
      className={action === "/api/sign-out" ? "" : "w-full"}
      disabled={loading}
      variant={action === "/api/sign-out" ? "destructive" : "default"}
    >
      Sign{loading ? "ing" : ""} {buttonSuffix}
    </Button>
  );
};
`;
  } else {
    return `"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "/api/sign-in" | "/api/sign-up" | "/api/sign-out";

const AuthForm = ({
  children,
  action,
}: {
  children?: React.ReactNode;
  action: Action;
}) => {
  const router = useRouter();
  const [errors, setErrors] = useState<{ error: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      action={action}
      method="post"
      className="mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);
        const formData = new FormData(e.currentTarget);
        const response = await fetch(action, {
          method: "POST",
          body: formData,
          redirect: "manual",
        });

        if (response.status === 0) {
          // redirected
          // when using \`redirect: "manual"\`, response status 0 is returned
          return router.refresh();
        }
        setErrors(await response.json());
        setLoading(false);
      }}
    >
      {errors ? (
        <div className="bg-red-100 p-3 my-4">
          <h3 className="font-bold text-md">Error!</h3>
          <p className="text-sm">{errors.error}</p>
        </div>
      ) : null}
      {children}
      <SubmitButton action={action} loading={loading} />
    </form>
  );
};

export default AuthForm;

const SubmitButton = ({
  action,
  loading,
}: {
  action: Action;
  loading: boolean;
}) => {
  let buttonSuffix = "";
  switch (action) {
    case "/api/sign-in":
      buttonSuffix = "in";
      break;
    case "/api/sign-out":
      buttonSuffix = "out";
      break;
    case "/api/sign-up":
      buttonSuffix = "up";
      break;
  }
  return (
    <button
      type="submit"
      className={\`p-2.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed \${
        action === "/api/sign-out" ? "bg-red-500" : "bg-neutral-900 w-full"
      }\`}
      disabled={loading}
    >
      Sign{loading ? "ing" : ""} {buttonSuffix}
    </button>
  );
};
`;
  }
};

const generateHomePage = () => {
  const { lucia, shared } = getFilePaths();
  const { componentLib } = readConfigFile();
  return `import AuthForm from "${formatFilePath(lucia.authFormComponent, {
    removeExtension: true,
    prefix: "alias",
  })}";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { redirect } from "next/navigation";

export default async function Home() {
  const { session } = await getUserAuth();
  if (!session) redirect("/sign-up");
  return (
    <main className="">
      <h1 className="text-2xl font-bold my-2">Profile</h1>
      <pre className="${
        componentLib === "shadcn-ui"
          ? "bg-card"
          : "bg-neutral-100 dark:bg-neutral-800"
      } p-4 rounded-lg my-2">
        {JSON.stringify(session, null, 2)}
      </pre>
      <AuthForm action="/api/sign-out" />
    </main>
  );
}
`;
};

const generateApiRoutes = () => {
  const { lucia } = getFilePaths();
  const signUpRoute = `import { auth } from "${formatFilePath(
    lucia.libAuthLucia,
    { prefix: "alias", removeExtension: true },
  )}";
import { LuciaError } from "lucia";
import * as context from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  // basic check
  if (
    typeof username !== "string" ||
    username.length < 4 ||
    username.length > 31
  ) {
    return NextResponse.json(
      {
        error: "Invalid username",
      },
      {
        status: 400,
      }
    );
  }
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return NextResponse.json(
      {
        error: "Invalid password",
      },
      {
        status: 400,
      }
    );
  }
  try {
    const user = await auth.createUser({
      key: {
        providerId: "username", // auth method
        providerUserId: username.toLowerCase(), // unique id when using "username" auth method
        password, // hashed by Lucia
      },
      attributes: {
        username,
        name: "",
        email: "",
      },
    });
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });
    const authRequest = auth.handleRequest(request.method, context);
    authRequest.setSession(session);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/", // redirect to profile page
      },
    });
  } catch (e) {
    // this part depends on the database you're using
    // check for unique constraint error in user table
    console.log(e);
    if (e instanceof LuciaError && e.message === "AUTH_DUPLICATE_KEY_ID") {
      return NextResponse.json(
        {
          error: "Username already taken",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error: "An unknown error occurred",
      },
      {
        status: 500,
      }
    );
  }
};
`;
  const signInRoute = `import { auth } from "${formatFilePath(
    lucia.libAuthLucia,
    { prefix: "alias", removeExtension: true },
  )}";
import * as context from "next/headers";
import { NextResponse } from "next/server";
import { LuciaError } from "lucia";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");
  // basic check
  if (
    typeof username !== "string" ||
    username.length < 1 ||
    username.length > 31
  ) {
    return NextResponse.json(
      {
        error: "Invalid username",
      },
      {
        status: 400,
      }
    );
  }
  if (
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 255
  ) {
    return NextResponse.json(
      {
        error: "Invalid password",
      },
      {
        status: 400,
      }
    );
  }
  try {
    // find user by key
    // and validate password
    const key = await auth.useKey("username", username.toLowerCase(), password);
    const session = await auth.createSession({
      userId: key.userId,
      attributes: {},
    });
    const authRequest = auth.handleRequest(request.method, context);
    authRequest.setSession(session);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/", // redirect to profile page
      },
    });
  } catch (e) {
    if (
      e instanceof LuciaError &&
      (e.message === "AUTH_INVALID_KEY_ID" ||
        e.message === "AUTH_INVALID_PASSWORD")
    ) {
      // user does not exist or invalid password
      return NextResponse.json(
        {
          error: "Incorrect username or password",
        },
        {
          status: 400,
        }
      );
    }
    return NextResponse.json(
      {
        error: "An unknown error occurred",
      },
      {
        status: 500,
      }
    );
  }
};
`;
  const signOutRoute = `import { auth } from "${formatFilePath(
    lucia.libAuthLucia,
    { prefix: "alias", removeExtension: true },
  )}";
import * as context from "next/headers";

import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  const authRequest = auth.handleRequest(request.method, context);
  // check if user is authenticated
  const session = await authRequest.validate();
  if (!session) {
    return new Response(null, {
      status: 401,
    });
  }
  // make sure to invalidate the current session!
  await auth.invalidateSession(session.sessionId);
  // delete session cookie
  authRequest.setSession(null);
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/sign-in", // redirect to login page
    },
  });
};
`;
  return { signInRoute, signUpRoute, signOutRoute };
};

const generateAppDTs = () => {
  const { lucia } = getFilePaths();
  return `// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("${formatFilePath(lucia.libAuthLucia, {
    prefix: "alias",
    removeExtension: true,
  })}").Auth;
  type DatabaseUserAttributes = {
    username: string;
    name: string;
    email: string;
  };
  type DatabaseSessionAttributes = {};
}
`;
};

const generateAuthDirFiles = (
  orm: ORMType,
  dbType: DBType,
  provider: DBProvider,
) => {
  const { lucia } = getFilePaths();
  let mappings: LuciaAdapterInfo;
  const DrizzleAdapterDriverMappings = generateDrizzleAdapterDriverMappings();
  const PrismaAdapterDriverMappings = generatePrismaAdapterDriverMappings();

  if (orm === "drizzle")
    mappings = DrizzleAdapterDriverMappings[dbType][provider];
  if (orm === "prisma") mappings = PrismaAdapterDriverMappings;

  const utilsTs = `import { redirect } from "next/navigation";
import { getPageSession } from "${formatFilePath(lucia.libAuthLucia, {
    removeExtension: true,
    prefix: "alias",
  })}";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
      username?: string;
    };
  } | null;
};
export const getUserAuth = async (): Promise<AuthSession> => {
  const session = await getPageSession();
  if (!session) return { session: null };
  return {
    session: {
      user: {
        id: session.user?.userId,
        name: session.user?.name,
        email: session.user?.email,
        username: session.user?.username,
      },
    },
  };
};

export const checkAuth = async () => {
  const session = await getPageSession();
  if (!session) redirect("/sign-in");
};
`;
  const luciaTs = `import { lucia } from "lucia";
import { nextjs_future } from "lucia/middleware";
import { cache } from "react";
import * as context from "next/headers";
${mappings.import}

export const auth = lucia({
  ${mappings.adapter},
  env: "DEV",
  middleware: nextjs_future(),
  sessionCookie: { expires: false },
  getUserAttributes: (data) => {
    return {
      username: data.username,
      email: data.email,
      name: data.name,
    };
  },
});

export type Auth = typeof auth;

export const getPageSession = cache(() => {
  const authRequest = auth.handleRequest("GET", context);
  return authRequest.validate();
});

`;

  return { utilsTs, luciaTs };
};

export const luciaGenerators = {
  generateViewsAndComponents,
  generateApiRoutes,
  generateAppDTs,
  generateAuthDirFiles,
};
