# Kirimase

Rails-like CLI for building projects with Nextjs and Drizzle ORM

## Current Supported Commands

1. Add - kirimase add
   Quickly initialise relevant files and configuration for:

   - Drizzle ORM (with your flavour of SQL and provider)
   - TRPC (working with Nextjs App Directory)
   - NextAuth

2. Generate - kirimase generate
   Similar to rails scaffold / generate, this command allows you to quickly generate:
   - Models (schema declaration + query/mutation logic)
   - Controllers (API + TRPC routes to manage querying and mutating of model)
