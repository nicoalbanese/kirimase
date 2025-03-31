import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    }
    return options
  },
  noExternal: ['@clack/*'],
}) 