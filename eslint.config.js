import neostandard from 'neostandard'
import noSecrets from 'eslint-plugin-no-secrets'

export default [
  ...neostandard({
    env: ['node', 'vitest'],
    ignores: [...neostandard.resolveIgnoresFromGitignore()],
    noJsx: true,
    noStyle: true
  }),
  {
    plugins: { 'no-secrets': noSecrets },
    rules: { 'no-secrets/no-secrets': ['error', { tolerance: 4.5 }] }
  }
]
