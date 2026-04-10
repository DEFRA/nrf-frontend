import { configureAxe } from 'vitest-axe'

export const configuredAxe = configureAxe({
  globalOptions: {
    checks: [{ id: 'wcag22a' }, { id: 'wcag22aa' }]
  }
})

export async function runAxeChecks(container, options = {}) {
  const results = await configuredAxe(container, options)
  expect(results).toHaveNoViolations()
}
