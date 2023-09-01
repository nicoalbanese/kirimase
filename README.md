# Kirimase

Rails-like CLI for building projects with Nextjs and Drizzle ORM

To get started, install Kirimase globally with your preferred package manager.

```bash
npm i -g kirimase
```

## Current Supported Commands

1. Add  
    Quickly initialise relevant files and configuration for:

   - Drizzle ORM (with your flavour of SQL and provider)
   - TRPC (working with Nextjs App Directory)
   - NextAuth

   ```bash
   kirimase add
   ```

2. Generate
   Similar to rails scaffold / generate, this command allows you to quickly generate:
   - Models (schema declaration + query/mutation logic)
   - Controllers (API + TRPC routes to manage querying and mutating of model)

```bash
kirimase generate
```
