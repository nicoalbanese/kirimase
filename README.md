# Kirimase

Rails-like CLI for building projects with Nextjs and Drizzle ORM

### Current Supported Commands

1. Init  
   Quickly initialise relevant files and configuration for Drizzle ORM.

2. Scaffold  
   Similar to rails scaffold <table_name> [fields], this command allows you to quickly generate
   - Models (schema declaration)
   - Views (Pages + Components)
   - Controllers (API routes to manage querying and mutating of model)

### TODOS

_MVP_

- [] Add Scaffold Logic for Views
  - [] Index Route that fetches all (maybe with some pagination?) and then includes id, first field, and link to see that item
  - [] Dynamic Route (view)
  - [] Dynamic Route (edit)
  - [] Create Route
  - [] Components: Item, CreateItemForm
- [] Add Fetcher

_Roadmap_

- [] Add Auth
- [] Add RQ
