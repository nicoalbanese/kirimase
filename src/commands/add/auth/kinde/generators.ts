import { formatFilePath, getFilePaths } from "../../../filePaths/index.js";

export const generateAuthUtils = () => {
  return `import {
  getKindeServerSession,
} from "@kinde-oss/kinde-auth-nextjs/server";
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
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user) {
    return {
      session: {
        user: {
          id: user.id,
          name: \`\${user.given_name} \${user.family_name}\`,
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
   if (session === null) redirect("/api/auth/login");
};
`;
};

export const generateKindeRouteHandler = () => {
  return `import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

export const GET = handleAuth();
`;
};

export const generateSignInComponent = () => {
  const { shared } = getFilePaths();
  return `import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    removeExtension: true,
    prefix: "alias",
  })}";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/server";

export default async function SignIn() {
  const { session } = await getUserAuth();
  if (session) {
    return (
      <div>
        <LogoutLink className="hover:underline">Log out</LogoutLink>
      </div>
    );
  } else {
    return (
      <div className="w-full space-y-2 pt-4">
        <LoginLink className="text-center block hover:bg-neutral-900 bg-neutral-800 text-neutral-50 px-4 py-2 rounded-lg">
          Sign in
        </LoginLink>
        <RegisterLink className="text-center block hover:bg-neutral-200 bg-neutral-100 text-neutral-800 px-4 py-2 rounded-lg">
          Sign up
        </RegisterLink>
      </div>
    );
  }
};

`;
};

export const generateSignInPage = () => {
  return `import SignIn from "${formatFilePath("components/auth/SignIn", { prefix: "alias", removeExtension: false })}";

const Page = async () => {
  return (
    <main className="bg-popover max-w-lg mx-auto my-4 rounded-lg p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <div className="">
        <SignIn />
      </div>
    </main>
  );
};

export default Page;
`;
};
