import { getByRole, getByTestId, queryByRole } from '@testing-library/dom'

import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'
import { mockUser } from '../../../test-utils/fixtures/mock-user.js'
import {
  agentClaims,
  citizenClaims,
  firstOrgName,
  multiOrgEmployeeClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { loadPage } from '../../../test-utils/load-page.js'

const ROUTE_PATH = '/request-to-use/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

describe('Enter address page', () => {
  it('redirects a signed-out visitor to sign in', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/auth/sign-in')
  })

  it('returns a signed-in user to the page after signing in', async () => {
    const challenge = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH
    })

    const { response } = await signIn({ cookie: getYarCookie(challenge) })

    expect(response.headers.location).toBe(ROUTE_PATH)
  })

  it('renders the page heading and title for a signed-in user', async () => {
    const { cookie } = await signIn()
    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What is your address?'
    )
    expect(document.title).toBe(
      'What is your address? - Nature restoration levy - GOV.UK'
    )
  })

  it('shows the name of the signed-in user', async () => {
    const { cookie } = await signIn()
    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'main')).toHaveTextContent(
      `You are signed in as ${mockUser.firstName} ${mockUser.lastName}.`
    )
  })

  describe('organisation', () => {
    const loadSignedInPage = async (claims) => {
      const { cookie } = await signIn({ claims })
      return loadPage({ requestUrl: ROUTE_PATH, server: getServer(), cookie })
    }

    it.each([
      ['an employee', singleOrgEmployeeClaims, firstOrgName, 'employee'],
      ['an agent', agentClaims, 'CDP Beneficiary Org', 'agent']
    ])(
      'says which organisation a user signed in as %s is representing',
      async (_, claims, orgName, relationship) => {
        const document = await loadSignedInPage(claims)

        expect(getByRole(document, 'main')).toHaveTextContent(
          `You are representing ${orgName} as an ${relationship}.`
        )
      }
    )

    it('does not mention an organisation for a user signed in as themselves', async () => {
      const document = await loadSignedInPage(citizenClaims)

      expect(getByRole(document, 'main')).not.toHaveTextContent(
        'You are representing'
      )
    })

    it('shows the organisation switcher above the page heading', async () => {
      const document = await loadSignedInPage(multiOrgEmployeeClaims)

      expect(
        getByTestId(document, 'app-organisation-heading')
      ).toHaveTextContent(firstOrgName)
      expect(
        getByRole(document, 'link', { name: 'Change organisation' })
      ).toHaveAttribute(
        'href',
        '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Fenter-address'
      )
    })

    it('does not offer to change organisation when there is nothing to switch to', async () => {
      const document = await loadSignedInPage()

      expect(
        queryByRole(document, 'link', {
          name: 'Change organisation'
        })
      ).not.toBeInTheDocument()
    })
  })
})
