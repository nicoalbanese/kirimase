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
      <div>
        <LoginLink className="hover:underline">Sign in</LoginLink>
        <br />
        <RegisterLink className="hover:underline">Sign up</RegisterLink>
      </div>
    );
  }
};

`;
};
