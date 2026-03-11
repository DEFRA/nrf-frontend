import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['node', 'vitest'],
    ignores: [...neostandard.resolveIgnoresFromGitignore()],
    noJsx: true,
    noStyle: true
  }),
  {
    files: ['src/server/plugins/swagger-initializer.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        XMLHttpRequest: 'readonly',
        SwaggerUIBundle: 'readonly',
        SwaggerUIStandalonePreset: 'readonly'
      }
    },
    rules: {}
  }
]
