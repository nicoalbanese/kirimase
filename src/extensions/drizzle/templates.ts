import { Template } from "karozu";
import { drizzle } from "./config";

// 1. Create File Example
export const drizzleConfig = new Template(drizzle, ({ props, utilities }) => ({
  title: `${utilities.toKebabCase("DrizzleConfig")}`,
  description: "This is the config for Drizzle",
  path: "drizzle.config.ts",
  // The operation is implicitly "create" when template is provided
  template: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "${props.dbType}",
  provider: "${props.provider}",
  schema: "./src/schema.ts",
  out: "./drizzle",
});
  `,
}));

export const dbInstance = new Template(drizzle, ({ props }) => {
  const templates = {
    neon: `
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" }); // or .env.local

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });`,
    planetscale: `
import { drizzle } from "drizzle-orm/planetscale-serverless";

export const db = drizzle({ connection: {
  host: process.env["DATABASE_HOST"],
  username: process.env["DATABASE_USERNAME"],
  password: process.env["DATABASE_PASSWORD"],
}});`,
    turso: `
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});
const db = drizzle({ client });`,
    'better-sqlite3': `
import { drizzle } from "drizzle-orm/better-sqlite3";
import { file } from "sqlite3";

export const db = drizzle({ client: new file("db.sqlite") });`,
  };

  return {
    title: "DB Instance",
    description: "This is the db instance for Drizzle",
    path: "lib/db/schema.ts",
    // Explicitly set operation to "create"
    operation: "create",
    template: templates[props.provider],
  };
});

// 2. Edit File Example
export const updateConfigFile = new Template(
  drizzle,
  ({ props, utilities }) => ({
    title: "Update Config File",
    description: "Updates environment variables in existing config file",
    path: ".env.example",
    operation: "edit",
    replacements: [
      {
        oldString: "DATABASE_URL=",
        newString: `DATABASE_URL=${props.provider === "neon" ? "postgresql://" : "sqlite://"}`,
      },
      {
        oldString: "# DB Config",
        newString: `# ${utilities.capitalize(props.dbType)} Database Configuration`,
      },
    ],
  }),
);

// 3. Append File Example
export const appendReadme = new Template(drizzle, ({ props, utilities }) => ({
  title: "Update README",
  description: "Add database setup instructions to README",
  path: "README.md",
  operation: "append",
  content: `
## Database Setup (${utilities.capitalize(props.dbType)} with ${utilities.capitalize(props.provider)})

This project uses ${utilities.capitalize(props.dbType)} with ${utilities.capitalize(props.provider)} as the database provider.
To set up your database:

1. Configure your environment variables in .env
2. Run migration: \`npm run db:migrate\`

For more information, refer to the documentation.
`,
}));

// 4. Delete File Example
export const removeOldConfig = new Template(drizzle, () => ({
  title: "Delete Old Config",
  description: "Removes the old database configuration file",
  path: "old-db-config.ts",
  operation: "delete",
}));

export const templates = [
  drizzleConfig,
  dbInstance,
  updateConfigFile,
  appendReadme,
  removeOldConfig,
];
