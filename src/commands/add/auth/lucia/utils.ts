// what do i need?
// in theoery i should be able to run
// each driver will have an import, and an adapter
// so it should follow {
// pg: {
//    driver: {
//        import: ""
//        adapter: ""
//        package: ""
//    }
// }

import { existsSync, readFileSync } from "fs";
import { DBProvider, DBType } from "../../../../types.js";
import { replaceFile } from "../../../../utils.js";
import { consola } from "consola";

export type LuciaAdapterInfo = {
  import: string;
  adapter: string;
  adapterPackage: string;
};
export const DrizzleAdapterDriverMappings: {
  [k in DBType]: Partial<{
    [k in DBProvider]: LuciaAdapterInfo;
  }>;
} = {
  pg: {
    neon: {
      adapter: `adapter: pg(pool, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-postgresql",
      import: `import { pg } from "@lucia-auth/adapter-postgresql";\nimport { pool } from "@/lib/db/index"`,
    },
    supabase: {
      adapter: `adapter: pg(pool, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-postgresql",
      import: `import { pg } from "@lucia-auth/adapter-postgresql";\nimport { pool } from "@/lib/db/index"`,
    },
    postgresjs: {
      adapter: `adapter: postgresAdapter(client, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-postgresql",
      import: `import { postgres as postgresAdapter } from "@lucia-auth/adapter-postgresql";\nimport { client } from "@/lib/db/index"`,
    },
    "node-postgres": {
      adapter: `adapter: pg(pool, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-postgresql",
      import: `import { pg } from "@lucia-auth/adapter-postgresql";\nimport { pool } from "@/lib/db/index"`,
    },
    "vercel-pg": {
      adapter: `adapter: pg(pool, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-postgresql",
      import: `import { pg } from "@lucia-auth/adapter-postgresql";\nimport { pool } from "@/lib/db/index"`,
    },
  },
  mysql: {
    "mysql-2": {
      adapter: `adapter: mysql2(poolConnection, {
		user: "user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-mysql",
      import: `import { mysql2 } from "@lucia-auth/adapter-mysql";\nimport { poolConnection } from "@/lib/db/index"`,
    },
    planetscale: {
      import: `import { planetscale } from "@lucia-auth/adapter-mysql";\nimport { connection } from "@/lib/db/index"`,
      adapterPackage: "@lucia-auth/adapter-mysql",
      adapter: `adapter: planetscale(connection, {
		user: "auth_user",
		key: "user_key",
		session: "user_session"
	})`,
    },
  },
  sqlite: {
    "better-sqlite3": {
      adapter: `adapter: betterSqlite3(sqlite, {
		user: "user",
		key: "user_key",
		session: "user_session"
	})`,
      adapterPackage: "@lucia-auth/adapter-sqlite",
      import: `import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";\nimport { sqlite } from "@/lib/db/index"`,
    },
  },
};

export const DrizzleLuciaSchema: { [k in DBType]: string } = {
  pg: `import { pgTable, bigint, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey(),
	// other user attributes
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	username: varchar("username", { length: 255 }),
});

export const sessions = pgTable("user_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => users.id),
	activeExpires: bigint("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigint("idle_expires", {
		mode: "number"
	}).notNull()
});

export const keys = pgTable("user_key", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull()
		.references(() => users.id),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});`,
  mysql: `import { mysqlTable, bigint, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("auth_user", {
	id: varchar("id", {
		length: 15 // change this when using custom user ids
	}).primaryKey(),
	// other user attributes
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	username: varchar("username", { length: 255 }),
});

export const keys = mysqlTable("user_key", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull(),
		// .references(() => users.id),
	hashedPassword: varchar("hashed_password", {
		length: 255
	})
});

export const sessions = mysqlTable("user_session", {
	id: varchar("id", {
		length: 128
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 15
	})
		.notNull(),
		// .references(() => users.id),
	activeExpires: bigint("active_expires", {
		mode: "number"
	}).notNull(),
	idleExpires: bigint("idle_expires", {
		mode: "number"
	}).notNull()
});`,
  sqlite: `import { sqliteTable, text, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
	id: text("id").primaryKey(),
	// other user attributes
	name: text("name"),
	email: text("email"),
	username: text("username"),
});

export const sessions = sqliteTable("user_session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	activeExpires: blob("active_expires", {
		mode: "bigint"
	}).notNull(),
	idleExpires: blob("idle_expires", {
		mode: "bigint"
	}).notNull()
});

export const keys = sqliteTable("user_key", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	hashedPassword: text("hashed_password")
});`,
};

export const PrismaLuciaSchema = `model User {
  id           String    @id @unique

  username String
  name     String?
  email    String?


  auth_session Session[]
  key          Key[]
}

model Session {
  id             String @id @unique
  user_id        String
  active_expires BigInt
  idle_expires   BigInt
  user           User   @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}

model Key {
  id              String  @id @unique
  hashed_password String?
  user_id         String
  user            User    @relation(references: [id], fields: [user_id], onDelete: Cascade)

  @@index([user_id])
}`;

export const PrismaAdapterDriverMappings: LuciaAdapterInfo = {
  import: `import { prisma } from "@lucia-auth/adapter-prisma";\nimport { db } from "@/lib/db/index";`,
  adapter: `adapter: prisma(db)`,
  adapterPackage: `@lucia-auth/adapter-prisma`,
};

export const addLuciaToPrismaSchema = async () => {
  const schemaPath = "prisma/schema.prisma";
  const schemaExists = existsSync(schemaPath);
  if (schemaExists) {
    const schemaContents = readFileSync(schemaPath, "utf-8");
    // write logic to check if model already exists -> if so replace

    const newContent = schemaContents.concat("\n", PrismaLuciaSchema);
    replaceFile(schemaPath, newContent);
    consola.success(`Added auth to Prisma schema`);
  } else {
    consola.info(`Prisma schema file does not exist`);
  }
};
