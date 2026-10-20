import neostandard from 'neostandard'
import noSecrets from 'eslint-plugin-no-secrets'

// neostandard >= 0.14 merges the `ignores` option into its file-scoped config
// objects, which stops ESLint pruning ignored directories such as .public and
// coverage build artifacts. A global ignore must be the lone key of a config
// object, so emit the gitignore-derived ignores separately.
const gitignoreIgnores = [...neostandard.resolveIgnoresFromGitignore()]

export default [
  { ignores: gitignoreIgnores },
  ...neostandard({
    env: ['node', 'vitest'],
    noJsx: true,
    noStyle: true
  }),
  {
    plugins: { 'no-secrets': noSecrets },
    rules: { 'no-secrets/no-secrets': ['error', { tolerance: 4.5 }] }
  }
]
