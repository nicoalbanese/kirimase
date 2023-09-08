import { consola } from "consola";
import { AuthProvider, AuthProviders, capitalised } from "./utils.js";
import fs from "fs";
import { DBType } from "../../../../types.js";
import { readConfigFile } from "../../../../utils.js";

// 1. Create app/api/auth/[...nextauth].ts
export const apiAuthNextAuthTs = (
  providers: AuthProvider[],
  dbType: DBType | null
) => {
  const providersToUse = providers.map((provider) => {
    return {
      name: provider,
      providerKey: AuthProviders[provider].code,
      website: AuthProviders[provider].website,
    };
  });

  return `${
    dbType !== null
      ? `import { db } from "@/lib/db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";`
      : ""
  }
import { DefaultSession, NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
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
      ? "adapter: DrizzleAdapter(db),"
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
export const libAuthUtilsTs = () => {
  return `import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const getUserAuth = async () => {
  const session = await getServerSession(authOptions);
  return { session };
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect("/api/auth/signin");
};
`;
};

// 4. create lib/db/schema/auth.ts
export const createAuthSchema = (dbType: DBType) => {
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
export const createSignInComponent = () => {
  return `"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function SignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
`;
};

// 6. updateTrpcTs
export const updateTrpcTs = () => {
  const { hasSrc } = readConfigFile();
  const filePath = `${hasSrc ? "src/" : ""}lib/server/trpc.ts`;

  const fileContent = fs.readFileSync(filePath, "utf-8");

  const protectedProcedureContent = `\n\nconst isAuthed = t.middleware((opts) => {
  const { ctx } = opts;
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: {
      session: ctx.session,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
`;
  const modifiedRouterContent = fileContent.concat(protectedProcedureContent);

  fs.writeFileSync(filePath, modifiedRouterContent);

  consola.success(
    "TRPC Router updated successfully to add protectedProcedure."
  );
};

export const enableSessionInContext = () => {
  const { hasSrc } = readConfigFile();
  const filePath = `${hasSrc ? "src/" : ""}lib/trpc/context.ts`;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const updatedContent = fileContent.replace(/\/\//g, "");

  fs.writeFileSync(filePath, updatedContent);

  consola.success("TRPC Context updated successfully to add Session data.");
};

export const enableSessionInTRPCApi = () => {
  const { hasSrc } = readConfigFile();
  const filePath = `${hasSrc ? "src/" : ""}lib/trpc/api.ts`;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const updatedContent = fileContent.replace(/\/\//g, "");

  fs.writeFileSync(filePath, updatedContent);

  consola.success("TRPC Server API updated successfully to add Session data.");
};
