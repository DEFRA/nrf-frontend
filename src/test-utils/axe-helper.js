import { configureAxe } from 'vitest-axe'

export const configuredAxe = configureAxe({
  globalOptions: {
    checks: [{ id: 'wcag22a' }, { id: 'wcag22aa' }]
  },
  rules: {
    // GOV.UK Frontend's `beforeContent` block (where the phase banner and
    // breadcrumbs sit) is rendered outside `<main>` by design, so non-landmark
    // children trip axe's best-practice region rule. Disable it to match the
    // GOV.UK Design System's own test configuration.
    region: { enabled: false }
  }
})

export async function runAxeChecks(container, options = {}) {
  const results = await configuredAxe(container, options)
  expect(results).toHaveNoViolations()
}
