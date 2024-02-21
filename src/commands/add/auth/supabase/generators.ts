import { readConfigFile } from "../../../../utils.js";
import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

const generateViewsAndComponents = (withShadCn: boolean) => {
  const signUpPage = generateSignUpPage(withShadCn);
  const signInPage = generateSignInPage(withShadCn);
  const authFormComponent = generateAuthFormComponent(withShadCn);
  const signOutButtonComponent = generateSignOutButtonComponent(withShadCn);
  const homePage = generateHomePage();
  const loadingPage = generateLoadingPage();

  return {
    signUpPage,
    signInPage,
    signOutButtonComponent,
    authFormComponent,
    homePage,
    loadingPage,
  };
};

export const generateSupabaseHelpers = () => {
  const { shared } = getFilePaths();
  return `
    import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
    import { env } from "${formatFilePath(shared.init.envMjs, {
      removeExtension: false,
      prefix: "alias",
    })}";
    import { cookies } from 'next/headers'
    import { type NextRequest, NextResponse } from "next/server";

    /* Only use this for client components ("use client" at the top of the file) */
    export const createSupabaseBrowserClient = createBrowserClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    /* Only use this for server only components */
    export const createSupabaseServerComponentClient = () => {
        return createServerClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name: string) {
                        return cookies().get(name)?.value
                    }
                }
            }
        )
    }

    /* Use this inside Server Actions or Route Handlers bc only in those u can set cookies */
    export const createSupabaseServerActionClient = () => {
        return createServerClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name: string) {
                    return cookies().get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                    cookies().set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                    cookies().set({ name, value: '', ...options })
                    }
                }
            }
        )
    }

    /* Use this inside Server Actions or Route Handlers bc only in those u can set cookies */
    export const createSupabaseApiRouteClient = () => {
        return createSupabaseServerActionClient()
    }

    /* Use this inside the middleware */
    export const createSupabaseMiddlewareClient = (request: NextRequest) => {
        // Create an unmodified response
        let response = NextResponse.next({
            request: {
                headers: request.headers
            }
        })

        const supabase = createServerClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    // If the cookie is updated, update the cookies for the request and response
                    request.cookies.set({
                        name,
                        value,
                        ...options
                    })
                    response = NextResponse.next({
                        request: {
                        headers: request.headers
                        }
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options
                    })
                },
                remove(name: string, options: CookieOptions) {
                    // If the cookie is removed, update the cookies for the request and response
                    request.cookies.set({
                        name,
                        value: '',
                        ...options
                    })
                    response = NextResponse.next({
                        request: {
                        headers: request.headers
                        }
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options
                    })
                }
            }}
        )
        return { supabase, response }
    }

    export const updateSession = async (request: NextRequest) => {
        try {
            const { supabase, response } = createSupabaseMiddlewareClient(request)
            // This will refresh session if expired - required for Server Components
            // https://supabase.com/docs/guides/auth/server-side/nextjs
            await supabase.auth.getUser()

            return response
        } catch (e) {
            // If you are here, a Supabase client could not be created!
            // This is likely because you have not set up environment variables.
            // Check out http://localhost:3000 for Next Steps.
            return NextResponse.next({
                request: {
                    headers: request.headers
                }
            })
        }
    }
`;
};

export const generateSignInPage = (withShadCn: boolean) => {
  const { supabase, shared } = getFilePaths();
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `
        import AuthForm from "${formatFilePath(supabase.authFormComponent, {
          removeExtension: true,
          prefix: "alias",
        })}";
        import { signIn } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";
        import { Input } from "${alias}/components/ui/input";
        import { Label } from "${alias}/components/ui/label";
        import Link from "next/link";

        const Page = async () => {
            return (
                <main className="max-w-lg mx-auto my-4 bg-popover p-10">
                    <h1 className="text-2xl font-bold text-center">
                        Sign in to your account
                    </h1>
                    <AuthForm action={signIn} authType="sign-in">
                        <Label htmlFor="email" className="text-muted-foreground">
                            Email
                        </Label>
                        <Input name="email" id="email" />
                        <br />
                        <Label htmlFor="password" className="text-muted-foreground">
                            Password
                        </Label>
                        <Input type="password" name="password" id="password" />
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
    return `
      import AuthForm from "${formatFilePath(supabase.authFormComponent, {
        removeExtension: true,
        prefix: "alias",
      })}";
        import { signIn } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";
        import Link from "next/link";

        const Page = async () => {
            return (
                <main className="max-w-lg mx-auto my-4 bg-white p-10">
                    <h1 className="text-2xl font-bold text-center">
                        Sign in to your account
                    </h1>
                    <AuthForm action={signUp} authType="sign-in">
                        <label
                            htmlFor="email"
                            className="block font-medium text-sm text-neutral-500"
                        >
                            Email
                        </label>
                        <input
                            name="email"
                            id="email"
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
  }
};

export const generateSignUpPage = (withShadCn: boolean) => {
  const { supabase, shared } = getFilePaths();
  const { alias } = readConfigFile();
  if (withShadCn) {
    return `
        import AuthForm from "${formatFilePath(supabase.authFormComponent, {
          removeExtension: true,
          prefix: "alias",
        })}";
        import { signUp } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";
        import { Input } from "${alias}/components/ui/input";
        import { Label } from "${alias}/components/ui/label";
        import Link from "next/link";

        const Page = async () => {
            return (
                <main className="max-w-lg mx-auto my-4 bg-popover p-10">
                    <h1 className="text-2xl font-bold text-center">Create an account</h1>
                    <AuthForm action={signUp} authType="sign-up">
                        <Label htmlFor="email" className="text-muted-foreground">
                            Email
                        </Label>
                        <Input name="email" id="email" />
                        <br />
                        <Label htmlFor="password" className="text-muted-foreground">
                            Password
                        </Label>
                        <Input type="password" name="password" id="password" />
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
    return `
      import AuthForm from "${formatFilePath(supabase.authFormComponent, {
        removeExtension: true,
        prefix: "alias",
      })}";
        import { signUp } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";
        import Link from "next/link";

        const Page = async () => {
            return (
                <main className="max-w-lg mx-auto my-4 bg-white p-10">
                    <h1 className="text-2xl font-bold text-center">Create an account</h1>
                    <AuthForm action={signUp} authType="sign-up">
                        <label
                            htmlFor="email"
                            className="block font-medium text-sm text-neutral-500"
                        >
                            Email
                        </label>
                        <input
                            name="email"
                            id="email"
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

export const generateSignOutButtonComponent = (withShadCn: boolean) => {
  const { alias } = readConfigFile();
  const { shared } = getFilePaths();
  if (withShadCn) {
    return `
        "use client";
        import { Button } from "${alias}/components/ui/button";
        import { signOut } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";

        export const SignOutButton = () => {
            return (
                <form action={signOut}>
                    <Button type="submit" className="bg-red-600 text-foreground">
                        Sign Out
                    </Button>
                </form>
            );
        };
    `;
  } else {
    return `
        "use client";

        import { signOut } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";

        export const SignOutButton = () => {
            return (
                <form action={signOut}>
                    <button type="submit" className="py-2.5 px-3.5 rounded-md bg-red-500 text-white hover:opacity-80 text-sm">
                        Sign Out
                    </button>
                </form>
            )
        }
    `;
  }
};

export const generateAuthFormComponent = (withShadCn: boolean) => {
  const { alias } = readConfigFile();
  const { shared } = getFilePaths();
  const authForm = `
        "use client";

        import { useFormState, useFormStatus } from "react-dom";
        import { redirect } from 'next/navigation';
        import { Button } from "${alias}/components/ui/button";
        import { type State } from "${formatFilePath(shared.auth.authActions, {
          prefix: "alias",
          removeExtension: true,
        })}";
        
        type AuthType = 'sign-in' | 'sign-up'
        type ServerAction = (state: State, formData: FormData) => State | Promise<State>

        function AuthForm({
            action,
            authType,
            children
        }: {
            action: ServerAction
            authType: AuthType
            children?: React.ReactNode
        }) {
            const [state, formAction] = useFormState(action, null)

            if (state?.redirectTo) redirect(state.redirectTo)

            return (
                <div className='flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2'>
                    <form
                        className='animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground'
                        action={formAction}>
                        {children}

                        {state?.error && <span className='text-red-600 my-4'>{state.error}</span>}

                        {state?.message && <span className='text-green-600 my-4'>{state.message}</span>}

                        <SubmitButton authType={authType} />
                    </form>
                </div>
            )
        }

        export default AuthForm

        const SubmitButton = ({ authType }: { authType: AuthType }) => {
        const buttonSuffix = authType === 'sign-in' ? 'in' : 'up'

        const { pending } = useFormStatus()
        `;

  if (withShadCn) {
    return (
      authForm +
      `
        return (
            <Button
                type='submit' 
                className='w-full' 
                disabled={pending}
                variant='default'
            >
                Sign{pending ? 'ing' : ''} {buttonSuffix}
            </Button>
        )}`
    );
  } else {
    return (
      authForm +
      `
        return (
            <button
                type='submit' 
                className='w-full' 
                disabled={pending}
            >
                Sign{pending ? 'ing' : ''} {buttonSuffix}
            </button>
        )}`
    );
  }
};

export const generateHomePage = () => {
  const { supabase, shared } = getFilePaths();
  const { componentLib } = readConfigFile();
  return `
    import { SignOutButton } from "${formatFilePath(
      supabase.signOutButtonComponent,
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
            <SignOutButton />
        </main>
    );
    }
`;
};
export const generateLoadingPage = () => {
  const { componentLib } = readConfigFile();
  const withShadCn = componentLib === "shadcn-ui";
  return `
    export default function Loading() {
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

export const generateApiRoutes = () => {
  const { supabase } = getFilePaths();
  return `
        import { createSupabaseApiRouteClient } from "${formatFilePath(
          supabase.libSupabaseAuthHelpers,
          {
            removeExtension: true,
            prefix: "alias",
          }
        )}";
        import { NextRequest, NextResponse } from "next/server";

        export async function GET(request: NextRequest) {
            const requestUrl = new URL(request.url);
            const code = requestUrl.searchParams.get("code");

            if (code) {
                const supabase = createSupabaseApiRouteClient();
                await supabase.auth.exchangeCodeForSession(code);
            }

            // URL to redirect to after sign in process completes
            return NextResponse.redirect(requestUrl.origin);
        }
    `;
};

const generateAuthDirFiles = () => {
  const { supabase } = getFilePaths();
  const utilsTs = `
    import { redirect } from "next/navigation";
    import { createSupabaseServerComponentClient } from "${formatFilePath(
      supabase.libSupabaseAuthHelpers,
      {
        removeExtension: true,
        prefix: "alias",
      }
    )}";

    export const getServerSession = async () => {
        const supabase = createSupabaseServerComponentClient();
        const {
            data: { session }
        } = await supabase.auth.getSession()

        return { session };
    };

    export const getServerUser = async () => {
        const supabase = createSupabaseServerComponentClient()
        const {
            data: { user }
        } = await supabase.auth.getUser()

        return { user }
    }

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
        const { user } = await getServerUser();

        if (user) {
            return {
                session: {
                    user: {
                        id: user.id,
                        name: user.user_metadata?.name ?? '', // user.user_metadata.name is only populated after the user has updated their name once. Supabase doesn't store the user's name by default.
                        email: user.email,
                    },
                },
            } as AuthSession;
        } else {
            return { session: null };
        }
    };

    export const checkAuth = async () => {
        const { session } = await getUserAuth();

        if (!session) redirect("/sign-in");
    };
`;

  const actionTs = `
    "use server"
    import { redirect } from "next/navigation";
    import { createSupabaseServerActionClient } from "${formatFilePath(
      supabase.libSupabaseAuthHelpers,
      {
        removeExtension: true,
        prefix: "alias",
      }
    )}"
    import { zfd } from 'zod-form-data'
    import { z } from 'zod'

    export type State = {
        error?: string
        message?: string
        redirectTo?: string
    } | null

    export const signOut = async () => {
        const supabase = createSupabaseServerActionClient()
        await supabase.auth.signOut()
        redirect('/')
    }

    const signInSchema = zfd.formData({
        email: zfd.text(
            z
                .string({
                    required_error: 'You have to enter an email address.',
                })
                .email({ message: 'Please provide a valid email address' })
        ),
        password: zfd.text(
            z
                .string({ required_error: 'You have to enter a password' })
                .min(8, 'Password must be longer than 8 characters.')
        ),
    })

    export const signIn = async (state: State, formData: FormData) => {
        const supabase = createSupabaseServerActionClient()
        const res = signUpSchema.safeParse(formData)

        if (!res.success) {
            const errors = res.error.flatten()
            const errorMessage = Object.values(errors.fieldErrors)
                .join('\\n')
                .replace(',', '\\n')
            return { error: errorMessage }
        }

        const { email, password } = signInSchema.parse(formData)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) return { error: error.message }

        return { redirectTo: '/' }
    }

    const signUpSchema = zfd.formData({
        email: zfd.text(
            z
                .string({
                    required_error: 'You have to enter an email address.',
                })
                .email({ message: 'Please provide a valid email address' })
        ),
        password: zfd.text(
            z
                .string({ required_error: 'You have to enter a password' })
                .min(8, 'Password must be longer than 8 characters.')
        ),
    })

    export const signUp = async (state: State, formData: FormData) => {
        const supabase = createSupabaseServerActionClient()
        const res = signUpSchema.safeParse(formData)

        if (!res.success) {
            const errors = res.error.flatten()
            const errorMessage = Object.values(errors.fieldErrors)
                .join('\\n')
                .replace(',', '\\n')
            return { error: errorMessage }
        }

        const { email, password } = signUpSchema.parse(formData)

        const { error } = await supabase.auth.signUp({ email, password })

        if (error) return { error: error.message }

        return { redirectTo: '/' }
    }

    export const updateUserName = async (state: State, formData: FormData) => {
        const supabase = createSupabaseServerActionClient()
        const username = formData.get('name') as string

        const { error } = await supabase.auth.updateUser({ data: { username } })

        if (error) return { error: error.message }

        return { message: 'Successfully updated username!', ...state }
    }

    export const updateEmail = async (state: State, formData: FormData) => {
        const supabase = createSupabaseServerActionClient()
        const email = formData.get('email') as string

        const { error } = await supabase.auth.updateUser({ email })

        if (error) return { error: error.message }

        return { message: 'Successfully updated email!', ...state }
    }`;

  return { utilsTs, actionTs };
};

const generateMiddleware = () => {
  const { supabase } = getFilePaths();
  return `
    import { type NextRequest } from "next/server";
    import { updateSession } from "${formatFilePath(
      supabase.libSupabaseAuthHelpers,
      {
        removeExtension: true,
        prefix: "alias",
      }
    )}";

    export async function middleware(request: NextRequest) {
        return await updateSession(request);
    }

    export const config = {
        matcher: [
            /*
            * Match all request paths except:
            * - _next/static (static files)
            * - _next/image (image optimization files)
            * - favicon.ico (favicon file)
            * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
            * Feel free to modify this pattern to include more paths.
            */
            "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
        ],
    }; `;
};

export const supabaseGenerators = {
  generateMiddleware,
  generateViewsAndComponents,
  generateSupabaseHelpers,
  generateApiRoutes,
  generateAuthDirFiles,
};
