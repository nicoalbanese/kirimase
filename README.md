# Kirimase

Rails-like CLI for building projects with Nextjs and Drizzle ORM

### Current Supported Commands

1. Init  
   Quickly initialise relevant files and configuration for:

   - Drizzle ORM (with your flavour of SQL and provider)
   - TRPC (working with Nextjs App Directory)
   - NextAuth

2. Generate  
   Similar to rails generate <resources> <table_name> [fields], this command allows you to quickly generate
   - Models (schema declaration + query/mutation logic)
   - Views (Form Component to view edit and submit)
   - Controllers (API + TRPC routes to manage querying and mutating of model)
