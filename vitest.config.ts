import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Reuse the app's Vite config (React plugin + `@ -> ./src` alias) so tests
// resolve modules and transform JSX/TSX identically to the application build.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./setupTests.ts'],
      css: false,
    },
  }),
)
