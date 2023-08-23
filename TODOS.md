# Init Script

- [] Change from where is lib folder to "is there a lib folder?"
- [] after init script, create a kirimase.config.json that has the following
  - using src folder? (this will be used for lib folder and file creation)
  - db type (pg, mysql, sqlite)
  - db driver (deployment) (neon, vercel, turso, planetscale) - think at the start doing neon, vercel, and planetscale
  - orm (drizzle or prisma) (starting with drizzle)

# Generate Script

- [] move templates from template literals to handlebar formatted files (in templates folder)
- [] add implementation that allows user to select what they would like to scaffold
