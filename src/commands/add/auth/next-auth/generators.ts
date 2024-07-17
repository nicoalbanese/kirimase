import { consola } from "consola";
import {
  AuthDriver,
  AuthProvider,
  AuthProviders,
  capitalised,
} from "./utils.js";
import fs from "fs";
import { ComponentLibType, DBType, ORMType } from "../../../../types.js";
import { readConfigFile } from "../../../../utils.js";
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { formatFileContentWithPrettier } from "../../../init/utils.js";

// 1. Create app/api/auth/[...nextauth].ts
export const apiAuthNextAuthTsOld = (
  providers: AuthProvider[],
  dbType: DBType | null,
  orm: ORMType
) => {
  const { shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  const providersToUse = providers.map((provider) => {
    return {
      name: provider,
      providerKey: AuthProviders[provider].code,
      website: AuthProviders[provider].website,
    };
  });

  return `${
    dbType !== null
      ? `import { db } from "${formatFilePath(dbIndex, {
          prefix: "alias",
          removeExtension: true,
        })}";
${AuthDriver[orm].import}`
      : ""
  }
import { DefaultSession, NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import { Adapter } from "next-auth/adapters";
import { env } from "${formatFilePath(shared.init.envMjs, {
    prefix: "alias",
    removeExtension: false,
  })}"
${providersToUse
  .map(
    (provider) =>
      `import ${capitalised(provider.name)}Provider from "next-auth/providers/${
        provider.name
      }";`
  )
  .join("\n")}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  ${
    dbType !== null
      ? `adapter: ${AuthDriver[orm].adapter}(db) as Adapter,`
      : "// adapter: yourDBAdapterHere"
  }
  callbacks: {
    session: ({ session, user }) => {
      session.user.id = user.id;
      return session;
    },
  },
  providers: [
     ${providersToUse.map((provider) => provider.providerKey).join(",\n    ")}
  ],
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
`;
};

export const apiAuthNextAuthTs = () => {
  const { shared } = getFilePaths();

  return `import { DefaultSession } from "next-auth";
import NextAuth from "next-auth/next";
import { authOptions } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
`;
};

// 2. create lib/auth/Provider.tsx
export const libAuthProviderTsx = () => {
  return `"use client";

import { SessionProvider } from "next-auth/react";

type Props = {
  children?: React.ReactNode;
};

export default function NextAuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
};`;
};

// 3. create lib/auth/utils.ts
export const libAuthUtilsTsWithoutAuthOptions = () => {
  const { "next-auth": nextAuth } = getFilePaths();
  return `import { authOptions } from "${formatFilePath(
    nextAuth.nextAuthApiRoute,
    { removeExtension: true, prefix: "alias" }
  )}";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const getUserAuth = async () => {
  const session = await getServerSession(authOptions);
  return { session } as AuthSession;
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect("/api/auth/signin");
};
`;
};

export const libAuthUtilsTs = (
  providers: AuthProvider[],
  dbType: DBType | null,
  orm: ORMType
) => {
  const { shared } = getFilePaths();
  const dbIndex = getDbIndexPath();
  const providersToUse = providers.map((provider) => {
    return {
      name: provider,
      providerKey: AuthProviders[provider].code,
      website: AuthProviders[provider].website,
    };
  });

  return `${
    dbType !== null
      ? `import { db } from "${formatFilePath(dbIndex, {
          prefix: "alias",
          removeExtension: true,
        })}";
${AuthDriver[orm].import}`
      : ""
  }
import { DefaultSession, getServerSession, NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import { redirect } from "next/navigation";
import { env } from "${formatFilePath(shared.init.envMjs, {
    prefix: "alias",
    removeExtension: false,
  })}"
${providersToUse
  .map(
    (provider) =>
      `import ${capitalised(provider.name)}Provider from "next-auth/providers/${
        provider.name
      }";`
  )
  .join("\n")}

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
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

export const authOptions: NextAuthOptions = {
  ${
    dbType !== null
      ? `adapter: ${AuthDriver[orm].adapter}(db) as Adapter,`
      : "// adapter: yourDBAdapterHere"
  }
  callbacks: {
    session: ({ session, user }) => {
      session.user.id = user.id;
      return session;
    },
  },
  providers: [
     ${providersToUse.map((provider) => provider.providerKey).join(",\n    ")}
  ],
};


export const getUserAuth = async () => {
  const session = await getServerSession(authOptions);
  return { session } as AuthSession;
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect("/api/auth/signin");
};

`;
};

// 4. create lib/db/schema/auth.ts
export const createDrizzleAuthSchema = (dbType: DBType) => {
  const { provider } = readConfigFile();
  switch (dbType) {
    case "pg":
      return `import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);
`;
    case "mysql":
      return `import {
  int,
  timestamp,
  mysqlTable,
  primaryKey,
  varchar,${provider === "planetscale" ? "\n  text" : "\n  references"},
} from "drizzle-orm/mysql-core";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 }).notNull().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }).defaultNow(),
  image: varchar("image", { length: 255 }),
});

export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 })
      .notNull()${
        provider === "planetscale"
          ? ""
          : '\n.references(() => users.id, { onDelete: "cascade" })'
      },
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: varchar("refresh_token", { length: 255 }),
    access_token: varchar("access_token", { length: 255 }),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: ${
      provider === "planetscale"
        ? 'text("id_token"),'
        : 'varchar("id_token", { length: 255 }),'
    }
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

export const sessions = mysqlTable("session", {
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 })
    .notNull()${
      provider === "planetscale"
        ? ""
        : '\n.references(() => users.id, { onDelete: "cascade" })'
    },
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = mysqlTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);`;
    case "sqlite":
      return `import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);`;
    default:
      break;
  }
};

// 5. create components/auth/SignIn.tsx
export const createSignInComponent = (componentLib: ComponentLibType) => {
  const { alias } = readConfigFile();
  if (componentLib === "shadcn-ui") {
    return `"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "${alias}/components/ui/button";

export default function SignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <div className="space-y-3">
        <p>
          Signed in as{" "}
          <span className="font-medium">{session.user?.email}</span>
        </p>
        <Button variant={"destructive"} onClick={() => signOut({ callbackUrl: "/" })}>
          Sign out
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>Not signed in </p>
      <Button onClick={() => signIn()}>Sign in</Button>
    </div>
  );
}
`;
  } else {
    return `
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function SignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <div className="space-y-3">
        <p>
          Signed in as{" "}
          <span className="font-medium">{session.user?.email}</span>
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="py-2.5 px-3.5 rounded-md bg-red-500 text-white hover:opacity-80 text-sm"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>Not signed in </p>
      <button
        onClick={() => signIn()}
        className="bg-neutral-900 py-2.5 px-3.5 rounded-md font-medium text-white text-sm hover:opacity-90 transition-opacity"
      >
        Sign in
      </button>
    </div>
  );
}
`;
  }
};

// 6. updateTrpcTs
export const updateTrpcTs = async () => {
  const { trpc } = getFilePaths();
  const filePath = formatFilePath(trpc.serverTrpc, {
    removeExtension: false,
    prefix: "rootPath",
  });

  const fileContent = fs.readFileSync(filePath, "utf-8");

  const protectedProcedureContent = `\n\n/** Reusable middleware that enforces users are logged in before running the procedure. */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      // infers the \`session\` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees \`ctx.session.user\` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
`;
  const modifiedRouterContent = fileContent.concat(protectedProcedureContent);

  fs.writeFileSync(
    filePath,
    await formatFileContentWithPrettier(modifiedRouterContent,filePath)
  );

  // consola.success(
  //   "TRPC Router updated successfully to add protectedProcedure."
  // );
};

export const enableSessionInContext = async () => {
  const { trpc } = getFilePaths();
  const filePath = formatFilePath(trpc.trpcContext, {
    prefix: "rootPath",
    removeExtension: false,
  });

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const updatedContent = fileContent.replace(/\/\//g, "");

  fs.writeFileSync(
    filePath,
    await formatFileContentWithPrettier(updatedContent,filePath)
  );

  // consola.success("TRPC Context updated successfully to add Session data.");
};

// no longer necessary
export const enableSessionInTRPCApi_DEPRECATED = async () => {
  const { trpc } = getFilePaths();
  const filePath = formatFilePath(trpc.trpcApiTs, {
    prefix: "rootPath",
    removeExtension: false,
  });

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const updatedContent = fileContent.replace(/\/\//g, "");

  fs.writeFileSync(
    filePath,
    await formatFileContentWithPrettier(updatedContent,filePath)
  );

  // consola.success("TRPC Server API updated successfully to add Session data.");
};

export const createPrismaAuthSchema = (
  driver: DBType,
  usingPlanetScale: boolean,
  usingNextAuthGitHub: boolean
) => {
  return `model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  ${driver !== "sqlite" ? "@db.Text" : ""}
  access_token       String?  ${driver !== "sqlite" ? "@db.Text" : ""}
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  ${driver !== "sqlite" ? "@db.Text" : ""}
  session_state      String?

  ${usingNextAuthGitHub ? "refresh_token_expires_in Int?" : ""}

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])${
    usingPlanetScale ? "\n  @@index([userId])" : ""
  }
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)${
    usingPlanetScale ? "\n  @@index([userId])" : ""
  }
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}`;
};

export const generateUpdatedRootRoute = () => {
  const { shared } = getFilePaths();
  return `
import SignIn from "${formatFilePath(shared.auth.signInComponent, {
    prefix: "alias",
    removeExtension: true,
  })}";
import { getUserAuth } from "${formatFilePath(shared.auth.authUtils, {
    prefix: "alias",
    removeExtension: true,
  })}";

export default async function Home() {
  const { session } = await getUserAuth();
  return (
    <main className="space-y-4">
      {session ? (
        <pre className="bg-secondary p-4 rounded-sm shadow-sm text-secondary-foreground break-all whitespace-break-spaces">
          {JSON.stringify(session, null, 2)}
        </pre>
      ) : null}
      <SignIn />
    </main>
  );
}
`;
};

export const generateSignInPage = () => {
  return `"use client";

import { signIn } from "next-auth/react";

const Page = () => {
  return (
    <main className="bg-popover max-w-lg mx-auto my-4 rounded-lg p-10">
      <h1 className="text-2xl font-bold text-center">
        Sign in to your account
      </h1>
      <div className="mt-4">
        <button
          onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
          className="w-full bg-primary text-primary-foreground text-center hover:opacity-90 font-medium px-4 py-2 rounded-lg block"
        >
          Sign In
        </button>
      </div>
    </main>
  );
};

export default Page;
`;
};
