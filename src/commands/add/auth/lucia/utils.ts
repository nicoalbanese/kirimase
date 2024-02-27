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
import {
  formatFilePath,
  getDbIndexPath,
  getFilePaths,
} from "../../../filePaths/index.js";
import { updateRootSchema } from "../../../generate/generators/model/utils.js";

export type LuciaAdapterInfo = {
  import: string;
  adapter: string;
  adapterPackage: string;
};

export const generateDrizzleAdapterDriverMappings = () => {
  const dbIndex = getDbIndexPath();
  const pgAdapter = {
    adapter: `export const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);`,
    adapterPackage: "@lucia-auth/adapter-drizzle",
    import: `import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sessions, users } from "../db/schema/auth";
`,
  };

  const mySqlAdapter = {
    adapter: `export const adapter = new DrizzleMySQLAdapter(db, sessions, users);`,
    adapterPackage: "@lucia-auth/adapter-drizzle",
    import: `import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sessions, users } from "../db/schema/auth";
`,
  };

  const sqliteAdapter = {
    adapter: `export const adapter = new DrizzleSQLiteAdapter(db, sessions, users);`,
    adapterPackage: "@lucia-auth/adapter-drizzle",
    import: `import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { sessions, users } from "../db/schema/auth";
`,
  };

  const DrizzleAdapterDriverMappings: {
    [k in DBType]: Partial<{
      [k in DBProvider]: LuciaAdapterInfo;
    }>;
  } = {
    pg: {
      neon: pgAdapter,
      supabase: pgAdapter,
      postgresjs: pgAdapter,
      "node-postgres": pgAdapter,
      "vercel-pg": pgAdapter,
    },
    mysql: {
      "mysql-2": mySqlAdapter,
      planetscale: mySqlAdapter,
    },
    sqlite: {
      "better-sqlite3": sqliteAdapter,
      turso: sqliteAdapter,
    },
  };
  return DrizzleAdapterDriverMappings;
};

export const DrizzleLuciaSchema: { [k in DBType]: string } = {
  pg: `import { z } from "zod";  
import { pgTable, timestamp, text } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
	id: text("id").primaryKey(),
        email: text("email").notNull().unique(),
        hashedPassword: text("hashed_password").notNull(),
        name: text("name"),
});

export const sessions = pgTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull()
});
`,
  mysql: `import { z } from "zod";
import { mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";

export const users = mysqlTable("user", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	email: varchar("email", {
		length: 255
	}).notNull(),
	hashedPassword: varchar("hashed_password", {
		length: 255
	}).notNull(),
	name: varchar("name", {
		length: 255
	})
});

export const sessions = mysqlTable("session", {
	id: varchar("id", {
		length: 255
	}).primaryKey(),
	userId: varchar("user_id", {
		length: 255
	})
		.notNull()
		.references(() => users.id),
	expiresAt: datetime("expires_at").notNull()
});`,
  sqlite: `import { z } from "zod";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
        id: text("id").notNull().primaryKey(),
        email: text("email").notNull().unique(),
        hashedPassword: text("hashed_password").notNull(),
        name: text("name"),
});

export const sessions = sqliteTable("session", {
        id: text("id").notNull().primaryKey(),
        userId: text("user_id")
        .notNull()
        .references(() => users.id),
        expiresAt: integer("expires_at").notNull(),
});
`,
};

export const PrismaLuciaSchema = `model User {
  id             String    @id
  email          String    @unique
  hashedPassword String
  name           String?
  sessions       Session[]
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(references: [id], fields: [userId], onDelete: Cascade)
}
`;

export const generatePrismaAdapterDriverMappings = () => {
  const PrismaAdapterDriverMappings: LuciaAdapterInfo = {
    import: `import { PrismaAdapter } from "@lucia-auth/adapter-prisma";;`,
    adapter: `const adapter = new PrismaAdapter(db.session, db.user)`,
    adapterPackage: `@lucia-auth/adapter-prisma`,
  };
  return PrismaAdapterDriverMappings;
};
export const addLuciaToPrismaSchema = async () => {
  const schemaPath = "prisma/schema.prisma";
  const schemaExists = existsSync(schemaPath);
  if (schemaExists) {
    const schemaContents = readFileSync(schemaPath, "utf-8");
    // write logic to check if model already exists -> if so replace

    const newContent = schemaContents.concat("\n", PrismaLuciaSchema);
    replaceFile(schemaPath, newContent);
    // consola.success(`Added auth to Prisma schema`);
  } else {
    consola.info(`Prisma schema file does not exist`);
  }
};

export const updateDrizzleDbIndex = (provider: DBProvider) => {
  const { shared, drizzle } = getFilePaths();
  // what is it like to type like this'
  // functions intended use if with t3 so assumed provider is pscale
  if (provider === "planetscale") {
    const replacementContent = `import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";
import { env } from "${formatFilePath(shared.init.envMjs, {
      removeExtension: false,
      prefix: "alias",
    })}";
import * as schema from "./schema";
 
// create the connection
export const connection = connect({
  url: env.DATABASE_URL
});
 
export const db = drizzle(connection, { schema });
`;
    replaceFile(
      formatFilePath(drizzle.dbIndex, {
        prefix: "rootPath",
        removeExtension: false,
      }),
      replacementContent
    );
  }
  // TODO: NOW
  updateRootSchema("auth", true, "lucia");
};

export const addNodeRsFlagsToNextConfig = () => {
  const searchQuery = "const nextConfig = {};";
  const replacementText = `const nextConfig = {
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};
`;
  const path = "next.config.mjs";
  const ncExists = existsSync(path);
  if (!ncExists) {
    console.log("Could not find `next.config.mjs`. Please update it manually.");
  }

  const ncContents = readFileSync(path, "utf-8");
  const ncUpdated = ncContents.replace(searchQuery, replacementText);
  replaceFile(path, ncUpdated);
};
