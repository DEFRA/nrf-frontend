// @vitest-environment jsdom
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import {
  agentClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { reviewDetailsSessions } from '../../../test-utils/fixtures/review-details-personas.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const ROUTE_PATH = '/request-to-use/review-details'
const { getServer, signIn } = setupSignedInTestServer()

let seededSession = null
beforeAll(() => {
  seedRequestToUseSessionWith(getServer(), () => seededSession)
})

afterEach(() => {
  seededSession = null
})

describe('Review and confirm the developer details page accessibility checks', () => {
  it.each([
    ['an agent', agentClaims, reviewDetailsSessions.agent],
    ['an employee', singleOrgEmployeeClaims, reviewDetailsSessions.employee],
    ['an individual', undefined, reviewDetailsSessions.individual]
  ])('has no HTML accessibility issues for %s', async (_, claims, session) => {
    seededSession = session
    const { cookie } = await signIn({ claims })

    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
