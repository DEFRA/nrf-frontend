// @vitest-environment jsdom
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import {
  agentClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const ROUTE_PATH = '/request-to-use/review-details'
const { getServer, signIn } = setupSignedInTestServer()

const validAddress = {
  addressLine1: '1 Development Road',
  townOrCity: 'Development',
  postcode: 'DV1 6RP'
}

let seededSession = null
beforeAll(() => {
  seedRequestToUseSessionWith(getServer(), () => seededSession)
})

afterEach(() => {
  seededSession = null
})

describe('Review and confirm the developer details page accessibility checks', () => {
  it.each([
    [
      'an agent',
      agentClaims,
      {
        actualUserType: 'agent',
        organisation: { organisationName: 'CDP Beneficiary Org' }
      },
      'Trevor Barker'
    ],
    [
      'an employee',
      singleOrgEmployeeClaims,
      {
        actualUserType: 'employee',
        organisation: { organisationName: 'CDP Child Org 1' }
      },
      ''
    ],
    [
      'an individual',
      undefined,
      { actualUserType: 'individual', organisation: { organisationName: '' } },
      ''
    ]
  ])(
    'has no HTML accessibility issues for %s',
    async (_, claims, signin, fullName) => {
      seededSession = {
        address: { ...validAddress, fullName },
        signin
      }
      const { cookie } = await signIn({ claims })

      const document = await loadPage({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        cookie
      })
      await runAxeChecks(document.documentElement)
    }
  )
})
