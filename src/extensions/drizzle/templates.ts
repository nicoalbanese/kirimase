import { Template } from "karozu";
import { drizzle } from "./config";

// Drizzle Config Template
export const drizzleConfig = new Template(drizzle, ({ props }) => ({
  title: "drizzle-config",
  description: "Drizzle configuration file",
  path: "drizzle.config.ts",
  template: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "${props.dbType}",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
});`,
}));

// Database Instance Template
export const dbInstance = new Template(drizzle, ({ props }) => {
  const templates = {
    neon: `
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);`,
    planetscale: `
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";

const connection = connect({
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

export const db = drizzle(connection);`,
    turso: `
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

export const db = drizzle(client);`,
    'better-sqlite3': `
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite);`,
  };

  return {
    title: "db-instance",
    description: "Database instance configuration",
    path: "src/lib/db/index.ts",
    template: templates[props.provider],
  };
});

// Example Model Template
export const exampleModel = new Template(drizzle, ({ props }) => ({
  title: "example-model",
  description: "Example computer model with schema",
  path: "src/lib/db/schema/computers.ts",
  template: `import { sql } from "drizzle-orm";
import {
  integer,
  ${props.dbType === 'sqlite' ? 'sqliteTable' : 'pgTable'} as table,
  text,
  primaryKey,
} from "drizzle-orm/${props.dbType === 'sqlite' ? 'sqlite-core' : 'pg-core'}";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const computers = table("computers", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  cores: integer("cores").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const insertComputerSchema = createInsertSchema(computers);
export const selectComputerSchema = createSelectSchema(computers);
export const computerIdSchema = z.object({ id: z.string() });

export type Computer = z.infer<typeof selectComputerSchema>;
export type NewComputer = z.infer<typeof insertComputerSchema>;
export type ComputerId = z.infer<typeof computerIdSchema>;`,
}));

// Example Queries Template
export const exampleQueries = new Template(drizzle, ({ props }) => ({
  title: "example-queries",
  description: "Example queries for the computer model",
  path: "src/lib/api/computers/queries.ts",
  template: `import { db } from "../../db";
import { eq } from "drizzle-orm";
import { computerIdSchema, computers, ComputerId } from "../../db/schema/computers";

export const getComputers = async () => {
  const c = await db.select().from(computers);
  return { computers: c };
};

export const getComputerById = async (id: ComputerId) => {
  const { id: computerId } = computerIdSchema.parse({ id });
  const [c] = await db.select().from(computers).where(eq(computers.id, computerId));
  return { computer: c };
};`,
}));

// Example Mutations Template
export const exampleMutations = new Template(drizzle, ({ props }) => ({
  title: "example-mutations",
  description: "Example mutations for the computer model",
  path: "src/lib/api/computers/mutations.ts",
  template: `import { db } from "../../db";
import { eq } from "drizzle-orm";
import { NewComputer, insertComputerSchema, computers, computerIdSchema, ComputerId } from "../../db/schema/computers";

export const createComputer = async (computer: NewComputer) => {
  const newComputer = insertComputerSchema.parse(computer);
  try {
    ${props.dbType === 'mysql' ? '' : 'const [c] = '}await db.insert(computers).values(newComputer)${
    props.dbType === 'mysql' 
      ? '\n    return { success: true }' 
      : '.returning();\n    return { computer: c }'
  }
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again";
    console.error(message);
    throw { error: message };
  }
};

export const updateComputer = async (id: ComputerId, computer: NewComputer) => {
  const { id: computerId } = computerIdSchema.parse({ id });
  const newComputer = insertComputerSchema.parse(computer);
  try {
    ${props.dbType === 'mysql' ? '' : 'const [c] = '}await db
      .update(computers)
      .set(newComputer)
      .where(eq(computers.id, computerId!))${
    props.dbType === 'mysql'
      ? '\n    return { success: true };'
      : '.returning();\n    return { computer: c };'
  }
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again"
    console.error(message);
    throw { error: message };
  }
};

export const deleteComputer = async (id: ComputerId) => {
  const { id: computerId } = computerIdSchema.parse({ id });
  try {
    ${props.dbType === 'mysql' ? '' : 'const [c] = '}await db.delete(computers).where(eq(computers.id, computerId!))${
    props.dbType === 'mysql'
      ? '\n    return { success: true };'
      : '.returning();\n    return { computer: c };'
  }
  } catch (err) {
    const message = (err as Error).message ?? "Error, please try again"
    console.error(message);
    throw { error: message };
  }
};`,
}));

// Environment Template
export const envTemplate = new Template(drizzle, ({ props }) => ({
  title: "env",
  description: "Environment variables configuration",
  path: ".env",
  template: `# Database Configuration
DATABASE_URL=${props.provider === 'better-sqlite3' ? 'file:./sqlite.db' : 'postgresql://user:password@localhost:5432/db'}

# Additional Configuration
${props.provider === 'planetscale' ? `
DATABASE_HOST=
DATABASE_USERNAME=
DATABASE_PASSWORD=` : ''}
${props.provider === 'turso' ? `
DATABASE_AUTH_TOKEN=` : ''}`,
}));

// Migrate Template
export const migrateTemplate = new Template(drizzle, ({ props }) => ({
  title: "migrate",
  description: "Database migration script",
  path: "src/lib/db/migrate.ts",
  template: `import { drizzle } from "drizzle-orm/${props.provider === 'better-sqlite3' ? 'better-sqlite3' : props.provider}";
import { migrate } from "drizzle-orm/${props.provider === 'better-sqlite3' ? 'better-sqlite3' : props.provider}/migrator";
import { db } from "./index";
import * as schema from "./schema";

const runMigrate = async () => {
  console.log("⏳ Running migrations...");
  const start = Date.now();

  await migrate(db, { migrationsFolder: "drizzle" });

  const end = Date.now();
  console.log(\`✅ Migrations completed in \${end - start}ms\`);
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});`,
}));

// Tsconfig Update Template
export const tsconfigUpdate = new Template(drizzle, () => ({
  title: "tsconfig-update",
  description: "Update tsconfig.json for Drizzle",
  path: "tsconfig.json",
  operation: "edit",
  replacements: [
    {
      oldString: '"compilerOptions": {',
      newString: `"compilerOptions": {
    "target": "esnext",
    "baseUrl": "./",`,
    },
  ],
}));

export const templates = [
  drizzleConfig,
  dbInstance,
  exampleModel,
  exampleQueries,
  exampleMutations,
  envTemplate,
  migrateTemplate,
  tsconfigUpdate,
];
