// @vitest-environment jsdom
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'
import { agentClaims } from '../../../test-utils/fixtures/defra-id-org-claims.js'

const ROUTE_PATH = '/request-to-use/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

describe('Enter address page accessibility checks', () => {
  it.each([
    {
      variant: 'agent',
      claims: agentClaims,
      formData: { formVariant: 'agent' }
    },
    {
      variant: 'individual',
      claims: undefined,
      formData: { formVariant: 'individual' }
    }
  ])(
    'should have no HTML accessibility issues on the $variant variant after an invalid form submission',
    async ({ claims, formData }) => {
      const { cookie } = await signIn({ claims })
      const { cookie: erroredCookie } = await submitForm({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        formData,
        cookie
      })
      const document = await loadPage({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        cookie: erroredCookie
      })
      await runAxeChecks(document.documentElement)
    }
  )
})
