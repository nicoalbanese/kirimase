# Kirimase

Rails-like CLI for building projects with Nextjs and Drizzle ORM

### Quickly generate resources

![](https://github.com/nicoalbanese/gifs_for_demos/blob/main/gif_generate_script_1.gif?raw=true)

### With fully typesafe front-end thanks to Zod, TRPC, React Hook Form, and Shadcn-UI

![](https://github.com/nicoalbanese/gifs_for_demos/blob/main/gif_generate_script_2.gif?raw=true)

### Getting Started

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
   - Shadcn UI

   ```bash
   kirimase add
   ```

2. Generate
   Similar to rails scaffold / generate, this command allows you to quickly generate:

   - Models (schema declaration + query/mutation logic)
   - Controllers (API + TRPC routes to manage querying and mutating of model)
   - Views + Components (quickly scaffold route with components to perform CRUD operations)

   ```bash
   kirimase generate
   ```
