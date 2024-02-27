import { DBProvider, DBType, ORMType } from "../../../../types.js";
import { readConfigFile } from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import {
  generateDrizzleAdapterDriverMappings,
  LuciaAdapterInfo,
  generatePrismaAdapterDriverMappings,
} from "./utils.js";

const generateViewsAndComponents = (withShadCn: boolean) => {
  const signUpPage = generateSignUpPage(withShadCn);
  const signInPage = generateSignInPage(withShadCn);

  const authFormErrorComponent = generateAuthFormErrorComponent();

  const homePage = generateHomePage();
  const loadingPage = generateLoadingPage();

  const updatedSignOutButton = generateUpdatedSignoutButton(withShadCn);

  return {
    signUpPage,
    signInPage,
    authFormErrorComponent,
    homePage,
    loadingPage,
    updatedSignOutButton,
  };
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
  const { lucia } = getFilePaths();
  if (withShadCn) {
    return `"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";

import { signUpAction } from "${formatFilePath(lucia.usersActions, { prefix: "alias", removeExtension: true })}";

import { Label } from "${formatFilePath(`components/ui/label`, { prefix: "alias", removeExtension: false })}";
import { Input } from "${formatFilePath(`components/ui/input`, { prefix: "alias", removeExtension: false })}";
import { Button } from "${formatFilePath(`components/ui/button`, { prefix: "alias", removeExtension: false })}";
import AuthFormError from "${formatFilePath(`components/auth/AuthFormError`, { prefix: "alias", removeExtension: false })}";


export default function SignUpPage() {
  const [state, formAction] = useFormState(signUpAction, {
    error: "",
  });

  return (
    <main className="max-w-lg mx-auto my-4 bg-popover p-10">
      <h1 className="text-2xl font-bold text-center">Create an account</h1>
      <AuthFormError state={state} />
      <form action={formAction}>
        <Label htmlFor="email" className="text-muted-foreground">
          Email
        </Label>
        <Input name="email" type="email" id="email" required />
        <br />
        <Label htmlFor="password" className="text-muted-foreground">
          Password
        </Label>
        <Input type="password" name="password" id="password" required />
        <br />
        <SubmitButton />
      </form>
      <div className="mt-4 text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-secondary-foreground underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      Sign{pending ? "ing" : ""} up
    </Button>
  );
};
`;
  } else {
    return `
"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";

import { signUpAction } from "${formatFilePath(lucia.usersActions, { prefix: "alias", removeExtension: true })}";

import AuthFormError from "${formatFilePath(lucia.formErrorComponent, { prefix: "alias", removeExtension: true })}";

export default function SignUpPage() {
  const [state, formAction] = useFormState(signUpAction, {
    error: "",
  });

  return (
    <main className="max-w-lg mx-auto my-4 bg-popover p-10">
      <h1 className="text-2xl font-bold text-center">Create an account</h1>
      <AuthFormError state={state} />
      <form action={formAction}>
        <label
          htmlFor="email"
          className="block font-medium text-sm text-muted-foreground"
        >
          Email
        </label>
        <input
          name="email"
          type="email"
          id="email"
          required
          className="block w-full px-3 py-2 rounded-md border border-border focus:outline-primary"
        />
        <br />
        <label
          htmlFor="password"
          className="block font-medium text-sm text-muted-foreground"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          className="block w-full px-3 py-2 rounded-md border border-border focus:outline-primary"
        />
        <br />
        <SubmitButton />
      </form>
      <div className="mt-4 text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-secondary-foreground underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      className="bg-primary w-full p-2.5 rounded-md font-medium text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      type="submit"
      disabled={pending}
    >
      Sign{pending ? "ing" : ""} up
    </button>
  );
};

`;
  }
};

const generateSignInPage = (withShadCn: boolean) => {
  const { lucia } = getFilePaths();
  if (withShadCn) {
    return `"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";

import { signInAction } from "${formatFilePath(lucia.usersActions, { prefix: "alias", removeExtension: true })}";

import { Label } from "${formatFilePath(`components/ui/label`, { prefix: "alias", removeExtension: false })}";
import { Input } from "${formatFilePath(`components/ui/input`, { prefix: "alias", removeExtension: false })}";
import { Button } from "${formatFilePath(`components/ui/button`, { prefix: "alias", removeExtension: false })}";
import AuthFormError from "${formatFilePath(`components/auth/AuthFormError`, { prefix: "alias", removeExtension: false })}";

export default function SignInPage() {
  const [state, formAction] = useFormState(signInAction, {
    error: "",
  });

  return (
    <main className="max-w-lg mx-auto my-4 bg-popover p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <AuthFormError state={state} />
      <form action={formAction}>
        <Label htmlFor="email" className="text-muted-foreground">
          Email
        </Label>
        <Input name="email" id="email" type="email" required />
        <br />
        <Label htmlFor="password" className="text-muted-foreground">
          Password
        </Label>
        <Input type="password" name="password" id="password" required />
        <br />
        <SubmitButton />
      </form>
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
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      Sign{pending ? "ing" : ""} in
    </Button>
  );
};`;
  } else {
    return `"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";

import { signInAction } from "${formatFilePath(lucia.usersActions, { prefix: "alias", removeExtension: true })}";

import AuthFormError from "${formatFilePath(lucia.formErrorComponent, { prefix: "alias", removeExtension: true })}";

export default function SignInPage() {
  const [state, formAction] = useFormState(signInAction, {
    error: "",
  });

  return (
    <main className="max-w-lg mx-auto my-4 bg-popover p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <AuthFormError state={state} />
      <form action={formAction} className="flex flex-col">
        <label
          htmlFor="email"
          className="block font-medium text-sm text-muted-foreground"
        >
          Email
        </label>
        <input
          name="email"
          id="email"
          type="email"
          required
          className="block w-full px-3 py-2 rounded-md border border-border focus:outline-primary"
        />
        <br />
        <label
          htmlFor="password"
          className="block font-medium text-sm text-muted-foreground"
        >
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          className="block w-full px-3 py-2 rounded-md border border-border focus:outline-primary"
        />
        <br />
        <SubmitButton />
      </form>
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
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      className="bg-primary w-full p-2.5 rounded-md font-medium text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      type="submit"
      disabled={pending}
    >
      Sign{pending ? "ing" : ""} in
    </button>
  );
};
`;
  }
};

const generateAuthFormErrorComponent = () => {
  return `export default function AuthFormError({ state }: { state: { error: string } }) {
  if (state.error)
    return (
      <div className="w-full p-4 bg-destructive my-4 text-destructive-foreground text-xs">
        <h3 className="font-bold">Error</h3>
        <p>{state.error}</p>
      </div>
    );
  return null;
}
`;
};

const generateHomePage = () => {
  const { lucia, shared } = getFilePaths();
  const { componentLib } = readConfigFile();
  return `import SignOutBtn from "${formatFilePath(
    lucia.signOutButtonComponent,
    {
      removeExtension: true,
      prefix: "alias",
    }
  )}";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

export default async function Home() {
  const { session } = await getUserAuth();
  return (
    <main className="">
      <h1 className="text-2xl font-bold my-2">Profile</h1>
      <pre className="${
        componentLib === "shadcn-ui"
          ? "bg-secondary"
          : "bg-neutral-100 dark:bg-neutral-800"
      } p-4 rounded-lg my-2">
        {JSON.stringify(session, null, 2)}
      </pre>
      <SignOutBtn />
    </main>
  );
}
`;
};

const generateUserServerActions = () => {
  const { orm } = readConfigFile();

  const dbIndexPath = getDbIndexPath();

  if (orm === "prisma") {
    return `'use server'

import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation'

import { db } from "${formatFilePath(dbIndexPath, { removeExtension: true, prefix: "alias" })}";

import { Argon2id } from 'oslo/password'
import { generateId } from 'lucia'
import { lucia, validateRequest } from '../auth/lucia'
import {
  genericError,
  setAuthCookie,
  validateAuthFormData,
  getUserAuth,
} from '../auth/utils'

import { updateUserSchema } from "../db/schema/auth";

interface ActionResult {
  error: string
}

export async function signInAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { data, error } = validateAuthFormData(formData)
  if (error !== null) return { error }

  try {
    const existingUser = await db.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })
    if (!existingUser) {
      return {
        error: 'Incorrect username or password',
      }
    }

    const validPassword = await new Argon2id().verify(
      existingUser.hashedPassword,
      data.password
    )
    if (!validPassword) {
      return {
        error: 'Incorrect username or password',
      }
    }

    const session = await lucia.createSession(existingUser.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    setAuthCookie(sessionCookie);

    return redirect('/dashboard')
  } catch (e) {
    return genericError
  }
}

export async function signUpAction(
  _: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { data, error } = validateAuthFormData(formData)

  if (error !== null) return { error }

  const hashedPassword = await new Argon2id().hash(data.password)
  const userId = generateId(15)

  try {
    await db.user.create({
      data: {
        id: userId,
        email: data.email,
        hashedPassword,
      },
    })
  } catch (e) {
    return genericError
  }

  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)
  setAuthCookie(sessionCookie)
  return redirect('/dashboard')
}

export async function signOutAction(): Promise<ActionResult> {
  const { session } = await validateRequest()
  if (!session) {
    return {
      error: 'Unauthorized',
    }
  }

  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()
  setAuthCookie(sessionCookie)
  redirect('/sign-in')
}

export async function updateUser(
  _: any,
  formData: FormData,
): Promise<ActionResult & { success?: boolean }> {
  const { session } = await getUserAuth();
  if (!session) return { error: "Unauthorised" };

  const name = formData.get("name") ?? undefined;
  const email = formData.get("email") ?? undefined;

  const result = updateUserSchema.safeParse({ name, email });

  if (!result.success) {
    const error = result.error.flatten().fieldErrors;
    if (error.name) return { error: "Invalid name - " + error.name[0] };
    if (error.email) return { error: "Invalid email - " + error.email[0] };
    return genericError;
  }

  try {
    await db.user.update({
      data: { ...result.data },
      where: { id: session.user.id },
    });
    revalidatePath("/account");
    return { success: true, error: "" };
  } catch (e) {
    return genericError;
  }
}

`;
  }
  if (orm === "drizzle") {
    return `"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Argon2id } from "oslo/password";
import { lucia, validateRequest } from "../auth/lucia";
import { generateId } from "lucia";
import { eq } from "drizzle-orm";
import { db } from "${formatFilePath(dbIndexPath, { removeExtension: true, prefix: "alias" })}";

import {
  genericError,
  setAuthCookie,
  validateAuthFormData,
  getUserAuth,
} from "../auth/utils";
import { users, updateUserSchema } from "../db/schema/auth";

interface ActionResult {
  error: string;
}

export async function signInAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { data, error } = validateAuthFormData(formData);
  if (error !== null) return { error };

  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()));
    if (!existingUser) {
      return {
        error: "Incorrect username or password",
      };
    }

    const validPassword = await new Argon2id().verify(
      existingUser.hashedPassword,
      data.password,
    );
    if (!validPassword) {
      return {
        error: "Incorrect username or password",
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    setAuthCookie(sessionCookie);

    return redirect("/dashboard");
  } catch (e) {
    return genericError;
  }
}

export async function signUpAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { data, error } = validateAuthFormData(formData);

  if (error !== null) return { error };

  const hashedPassword = await new Argon2id().hash(data.password);
  const userId = generateId(15);

  try {
    await db.insert(users).values({
      id: userId,
      email: data.email,
      hashedPassword,
    });
  } catch (e) {
    return genericError;
  }

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setAuthCookie(sessionCookie);
  return redirect("/dashboard");
}

export async function signOutAction(): Promise<ActionResult> {
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  setAuthCookie(sessionCookie);
  redirect("/sign-in");
}

export async function updateUser(
  _: any,
  formData: FormData,
): Promise<ActionResult & { success?: boolean }> {
  const { session } = await getUserAuth();
  if (!session) return { error: "Unauthorised" };

  const name = formData.get("name") ?? undefined;
  const email = formData.get("email") ?? undefined;

  const result = updateUserSchema.safeParse({ name, email });

  if (!result.success) {
    const error = result.error.flatten().fieldErrors;
    if (error.name) return { error: "Invalid name - " + error.name[0] };
    if (error.email) return { error: "Invalid email - " + error.email[0] };
    return genericError;
  }

  try {
    await db
      .update(users)
      .set({ ...result.data })
      .where(eq(users.id, session.user.id));
    revalidatePath("/account");
    return { success: true, error: "" };
  } catch (e) {
    return genericError;
  }
}

`;
  }
};

const generateAuthDirFiles = (
  orm: ORMType,
  dbType: DBType,
  provider: DBProvider
) => {
  const dbIndexPath = getDbIndexPath();
  let mappings: LuciaAdapterInfo;
  const DrizzleAdapterDriverMappings = generateDrizzleAdapterDriverMappings();
  const PrismaAdapterDriverMappings = generatePrismaAdapterDriverMappings();

  if (orm === "drizzle")
    mappings = DrizzleAdapterDriverMappings[dbType][provider];
  if (orm === "prisma") mappings = PrismaAdapterDriverMappings;

  const utilsTs = `import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { type Cookie } from 'lucia'

import { validateRequest } from './lucia'
import { UsernameAndPassword, authenticationSchema } from '../db/schema/auth'

export type AuthSession = {
  session: {
    user: {
      id: string
      name?: string
      email?: string
      username?: string
    }
  } | null
}
export const getUserAuth = async (): Promise<AuthSession> => {
  const { session, user } = await validateRequest()
  if (!session) return { session: null }
  return {
    session: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
  }
}

export const checkAuth = async () => {
  const { session } = await validateRequest()
  if (!session) redirect('/sign-in')
}

export const genericError = { error: 'Error, please try again.' }

export const setAuthCookie = (cookie: Cookie) => {
  // cookies().set(cookie.name, cookie.value, cookie.attributes); // <- suggested approach from the docs, but does not work with \`next build\` locally
  cookies().set(cookie);
}

const getErrorMessage = (errors: any): string => {
  if (errors.email) return 'Invalid Email'
  if (errors.password) return 'Invalid Password - ' + errors.password[0]
  return '' // return a default error message or an empty string
}

export const validateAuthFormData = (
  formData: FormData
):
  | { data: UsernameAndPassword; error: null }
  | { data: null; error: string } => {
  const email = formData.get('email')
  const password = formData.get('password')
  const result = authenticationSchema.safeParse({ email, password })

  if (!result.success) {
    return {
      data: null,
      error: getErrorMessage(result.error.flatten().fieldErrors),
    }
  }

  return { data: result.data, error: null }
}

`;
  const luciaTs = `import { cookies } from 'next/headers'
import { cache } from 'react'

import { type Session, type User, Lucia } from 'lucia'
import { db } from "${formatFilePath(dbIndexPath, { prefix: "alias", removeExtension: true })}";

${mappings.import}

${mappings.adapter}

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      email: attributes.email,
      name: attributes.name,
    }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

interface DatabaseUserAttributes {
  email: string
  name: string;
}

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null
    if (!sessionId) {
      return {
        user: null,
        session: null,
      }
    }

    const result = await lucia.validateSession(sessionId)
    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id)
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        )
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie()
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        )
      }
    } catch {}
    return result
  }
)
`;

  return { utilsTs, luciaTs };
};

const generateUpdatedSignoutButton = (withShadcn: boolean) => {
  const { lucia } = getFilePaths();
  if (withShadcn) {
    return `"use client";

import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { signOutAction } from "${formatFilePath(lucia.usersActions, { prefix: "alias", removeExtension: true })}";

export default function SignOutBtn() {
  return (
    <form action={signOutAction} className="w-full text-left">
      <Btn />
    </form>
  );
}

const Btn = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={"destructive"}>
      Sign{pending ? "ing" : ""} out
    </Button>
  );
};
`;
  } else {
    return `"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "${formatFilePath(lucia.usersActions, { prefix: "alias", removeExtension: true })}";

export default function SignOutBtn() {
  return (
    <form action={signOutAction} className="w-full text-left">
      <Btn />
    </form>
  );
}

const Btn = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-destructive text-destructive-foreground px-2.5 py-1.5 text-sm rounded-md hover:opacity-90 disabled:opacity-50"
    >
      Sign{pending ? "ing" : ""} out
    </button>
  );
};
`;
  }
};

export const luciaGenerators = {
  generateViewsAndComponents,
  generateAuthDirFiles,
  generateUserServerActions,
};
