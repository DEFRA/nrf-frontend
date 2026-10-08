import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // Inline @defra/nrf-library so vi.mock intercepts the packages it
    // imports (for example aws-embedded-metrics in the metrics helper)
    server: {
      deps: {
        inline: ['@defra/nrf-library']
      }
    },
    setupFiles: ['.vite/setup-files.js'],
    globalSetup: ['.vite/global-setup.js'],
    environment: 'node',
    mockReset: true,
    unstubGlobals: true,
    testTimeout: 10000,
    maxWorkers: '50%',
    minWorkers: 1,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      exclude: [
        ...configDefaults.exclude,
        '.public',
        'coverage',
        'postcss.config.js',
        'stylelint.config.js'
      ]
    }
  }
})
