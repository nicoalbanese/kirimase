# Kirimase CLI for Next.js

![npm](https://img.shields.io/npm/v/kirimase?style=flat-square)

Kirimase is a command-line tool for building full-stack Next.js apps faster. It supercharges your development workflow, allowing you to seamlessly integrate essential packages and scaffold your application with best practices in mind.

[DEMO](https://www.loom.com/share/cb329939c83b4c9eb6a56abfd2638bd4?sid=6d902fcc-3ef6-4436-bf7d-9d0c2943812f)

## Features

1. **Initialization and Configuration**: quickly add and set up essential packages to jump-start your Next.js project.
2. **Code Generation**: scaffold models, views, and controllers directly from the CLI.

## Quick Start

Install Kirimase CLI globally:

```bash
npm install -g kirimase
```

## Commands

### 1. `kirimase add`

Initializes and configures the following packages for your Next.js project:

#### a) Drizzle-ORM

- Based on your chosen database type (PostgreSQL, MySQL, SQLite), Kirimase sets up the required files for Drizzle-ORM and drizzle-kit to manage migrations.
- Scripts are auto-added to `package.json` for immediate use of drizzle-kit.

#### b) tRPC

- Generates files to configure tRPC with the app router.
- Provides client-side tRPC and scaffolds server-side configuration using the experimental server-invoker pattern.
- Wraps the root layout in the tRPC provider.

#### c) Auth.js

- Generates files for Auth.js (Next-Auth), including the latest Drizzle adapter. (For PlanetScale, references are excluded as it doesn't support foreign keys).
- Generates a generic sign-in component for immediate use within your Next.js project.
- Wraps the root layout with the auth provider and generates utilities for auth checks and redirects in your Next.js routes.

#### d) Shadcn-UI

- Initiates the Shadcn-UI CLI designed for Next.js and installs button and toast components.
- Inserts the toast-provider (`<Toaster />`) to the root layout for instant toast notifications in your Next.js app.

Kirimase also adds relevant keys to your `.env` which you'll need to provide values for.

### 2. `kirimase generate`

Akin to `rails scaffold` but for Next.js:

![](https://github.com/nicoalbanese/gifs_for_demos/blob/main/gif_generate_script_1.gif?raw=true)

![](https://github.com/nicoalbanese/gifs_for_demos/blob/main/gif_generate_script_2.gif?raw=true)

Kirimase generates:

#### a) Model:

- Generates a drizzle schema with column types based on your SQL flavor and database provider.
- Uses drizzle-zod to generate Zod schemas for frontend and backend validation.
- Generates queries and mutations for CRUD operations, fully typed and optimized for consumption via a Next.js front-end.

#### b) Controller:

- Gives you an option to integrate tRPC and/or API routes.
- Uses Zod schemas from models for request validation.
- Includes built-in error handling for API routes and auto-adding of tRPC routes to the root router.

#### c) Views:

- Scaffolds views using Shadcn-UI to enable immediate CRUD operations (including select fields for adding relations and datepickers for dates).

## Contributing

Keen on enhancing Kirimase? Contributions, bug reports, and feature requests are always welcome. Feel free to open an issue or submit a pull request.

## License

[MIT](LICENSE)
