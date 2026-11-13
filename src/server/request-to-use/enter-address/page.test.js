import {
  getByLabelText,
  getByRole,
  getByTestId,
  queryByLabelText,
  queryByTestId,
  queryByRole
} from '@testing-library/dom'

import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'
import {
  agentClaims,
  citizenClaims,
  firstOrgName,
  multiOrgEmployeeClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'

const ROUTE_PATH = '/request-to-use/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

const agentGuidance =
  "If you are an agent requesting to use the nature restoration levy on behalf of someone else, enter the developer's full name and address."
const individualGuidance =
  'If you are requesting to use the nature restoration levy for yourself, enter your own address.'
const employeeGuidance =
  'If you are an employee, volunteer or contractor of the business or organisation that is requesting to use the nature restoration levy, enter the address for the business or organisation.'

const validAddress = {
  addressLine1: '1 Development Road',
  townOrCity: 'Development',
  postcode: 'DV1 6RP'
}

const agentFullName = 'Trevor Barker'

let seededSession = null
beforeAll(() => {
  seedRequestToUseSessionWith(getServer(), () => seededSession)
})

afterEach(() => {
  seededSession = null
})

const loadSignedInPage = async ({ claims, session } = {}) => {
  if (session) {
    seededSession = session
  }
  const { cookie } = await signIn({ claims })
  return loadPage({ requestUrl: ROUTE_PATH, server: getServer(), cookie })
}

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

  it('shows the sign out link for a signed-in user', async () => {
    const document = await loadSignedInPage()

    expect(getByRole(document, 'link', { name: 'Sign out' })).toHaveAttribute(
      'href',
      '/auth/sign-out'
    )
  })

  describe('variants', () => {
    it.each([
      {
        scenario: 'for a user without an organisation',
        claims: undefined,
        heading: 'What is your address?',
        guidance: individualGuidance,
        formVariant: 'individual',
        showsFullName: false
      },
      {
        scenario: 'for an employee',
        claims: singleOrgEmployeeClaims,
        heading: `What is the address for ${firstOrgName}?`,
        guidance: employeeGuidance,
        formVariant: 'employee',
        showsFullName: false
      },
      {
        scenario: 'for an agent',
        claims: agentClaims,
        heading: 'What are the details for CDP Beneficiary Org?',
        guidance: agentGuidance,
        formVariant: 'agent',
        showsFullName: true
      }
    ])(
      'renders the right variant $scenario',
      async ({ claims, heading, guidance, formVariant, showsFullName }) => {
        const document = await loadSignedInPage({ claims })

        expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
          heading
        )
        expect(getByRole(document, 'main')).toHaveTextContent(guidance)
        if (showsFullName) {
          expect(getByLabelText(document, 'Full name')).toBeInTheDocument()
        } else {
          expect(
            queryByLabelText(document, 'Full name')
          ).not.toBeInTheDocument()
        }
        expect(document.querySelector('input[name="formVariant"]')).toHaveValue(
          formVariant
        )
      }
    )

    it('uses the individual variant heading as the page title', async () => {
      const document = await loadSignedInPage()

      expect(document.title).toBe(
        'What is your address? - Nature restoration levy - GOV.UK'
      )
    })

    it('renders the address fields for every variant', async () => {
      const document = await loadSignedInPage()

      for (const label of [
        'Address line 1',
        'Address line 2 (optional)',
        'Town or city',
        'County (optional)',
        'Postcode'
      ]) {
        expect(getByLabelText(document, label)).toBeInTheDocument()
      }
    })

    it('ignores the saved who are you requesting to use the levy for answer and uses the Defra ID relationship', async () => {
      const document = await loadSignedInPage({
        claims: singleOrgEmployeeClaims,
        session: { signin: { intendedUserType: 'agent' } }
      })

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        `What is the address for ${firstOrgName}?`
      )
    })
  })

  it.each([
    ['there are no earlier answers', undefined, '/request-to-use/variation'],
    [
      'the development is not a variation',
      { variation: 'no', originalCommitted: 'yes' },
      '/request-to-use/variation'
    ],
    [
      'the original permission was not committed',
      { variation: 'yes', originalCommitted: 'no' },
      '/request-to-use/original-committed'
    ],
    [
      'the original permission was committed',
      { variation: 'yes', originalCommitted: 'yes' },
      '/request-to-use/original-reference'
    ]
  ])(
    'links back to the previous question when %s',
    async (_, session, expected) => {
      const { cookie } = await signIn()
      seededSession = session
      await loadPage({ requestUrl: ROUTE_PATH, server: getServer(), cookie })

      const document = await loadPage({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        cookie
      })

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        expected
      )
    }
  )

  describe('organisation heading', () => {
    it('shows the organisation switcher above the page heading', async () => {
      const document = await loadSignedInPage({
        claims: multiOrgEmployeeClaims
      })

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

    it.each([
      '/request-to-use/defra-account-user-type',
      '/request-to-use/variation'
    ])('does not show the organisation switcher on %s', async (requestUrl) => {
      const { cookie } = await signIn({ claims: multiOrgEmployeeClaims })
      const document = await loadPage({
        requestUrl,
        server: getServer(),
        cookie
      })

      expect(
        queryByTestId(document, 'app-organisation-heading')
      ).not.toBeInTheDocument()
      expect(
        queryByRole(document, 'link', { name: 'Change organisation' })
      ).not.toBeInTheDocument()
    })

    it('does not offer to change organisation when there is nothing to switch to', async () => {
      const document = await loadSignedInPage()

      expect(
        queryByRole(document, 'link', {
          name: 'Change organisation'
        })
      ).not.toBeInTheDocument()
    })

    it('does not say the user is representing an organisation in the page content', async () => {
      const document = await loadSignedInPage({ claims: agentClaims })

      expect(getByRole(document, 'main')).not.toHaveTextContent(
        'You are representing'
      )
    })

    it('does not name the signed-in user in the page content', async () => {
      const document = await loadSignedInPage({ claims: citizenClaims })

      expect(getByRole(document, 'main')).not.toHaveTextContent(
        'You are signed in as'
      )
    })
  })

  it('contains a CSRF token in the form', async () => {
    const document = await loadSignedInPage()

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  describe('submitting the form', () => {
    it.each([
      {
        scenario: 'an individual',
        claims: undefined,
        formVariant: 'individual',
        fullName: undefined
      },
      {
        scenario: 'an employee',
        claims: singleOrgEmployeeClaims,
        formVariant: 'employee',
        fullName: undefined
      },
      {
        scenario: 'an agent',
        claims: agentClaims,
        formVariant: 'agent',
        fullName: agentFullName
      }
    ])(
      'redirects $scenario to the review details page',
      async ({ claims, formVariant, fullName }) => {
        const { cookie } = await signIn({ claims })
        const { response } = await submitForm({
          requestUrl: ROUTE_PATH,
          server: getServer(),
          formData: { formVariant, fullName, ...validAddress },
          cookie
        })

        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe('/request-to-use/review-details')
      }
    )

    it('bounces a post whose hidden variant field no longer matches the server-resolved variant', async () => {
      const { cookie } = await signIn({ claims: singleOrgEmployeeClaims })
      await loadPage({ requestUrl: ROUTE_PATH, server: getServer(), cookie })

      const { response, cookie: bouncedCookie } = await submitForm({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        formData: { formVariant: 'individual', ...validAddress },
        cookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(ROUTE_PATH)

      const document = await loadPage({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        cookie: bouncedCookie
      })
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        `What is the address for ${firstOrgName}?`
      )
      expect(getByLabelText(document, 'Address line 1')).toHaveValue('')
    })

    it('re-shows the saved answers, with the postcode normalised', async () => {
      const { cookie } = await signIn()
      const { cookie: savedCookie } = await submitForm({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        formData: {
          formVariant: 'individual',
          ...validAddress,
          addressLine2: 'Building 2',
          county: 'Devonshire',
          postcode: '  sw1a 2-pq!! '
        },
        cookie
      })

      const document = await loadPage({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        cookie: savedCookie
      })

      expect(getByLabelText(document, 'Address line 1')).toHaveValue(
        validAddress.addressLine1
      )
      expect(getByLabelText(document, 'Address line 2 (optional)')).toHaveValue(
        'Building 2'
      )
      expect(getByLabelText(document, 'Town or city')).toHaveValue(
        'Development'
      )
      expect(getByLabelText(document, 'County (optional)')).toHaveValue(
        'Devonshire'
      )
      expect(getByLabelText(document, 'Postcode')).toHaveValue('SW1A 2PQ')
    })
  })

  describe('validation errors', () => {
    const loadErroredPage = async (formData, claims) => {
      const { cookie } = await signIn({ claims })
      const { response, cookie: erroredCookie } = await submitForm({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        formData,
        cookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(ROUTE_PATH)

      const document = await loadPage({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        cookie: erroredCookie
      })
      return document
    }

    it('shows an error for every missing mandatory field on the developer details variant', async () => {
      const document = await loadErroredPage(
        { formVariant: 'agent' },
        agentClaims
      )

      expectInputError({
        document,
        inputLabel: 'Full name',
        errorMessage: 'Enter the full name'
      })
      expectInputError({
        document,
        inputLabel: 'Address line 1',
        errorMessage: 'Enter address line 1, typically the building and street'
      })
      expectInputError({
        document,
        inputLabel: 'Town or city',
        errorMessage: 'Enter town or city'
      })
      expectInputError({
        document,
        inputLabel: 'Postcode',
        errorMessage: 'Enter postcode'
      })
      expect(document.title).toMatch(/^Error: What are the details for /)
    })

    it('shows an error only for the missing address fields on the individual variant', async () => {
      const document = await loadErroredPage({ formVariant: 'individual' })

      expect(queryByLabelText(document, 'Full name')).not.toBeInTheDocument()
      expectInputError({
        document,
        inputLabel: 'Address line 1',
        errorMessage: 'Enter address line 1, typically the building and street'
      })
      expectInputError({
        document,
        inputLabel: 'Town or city',
        errorMessage: 'Enter town or city'
      })
      expectInputError({
        document,
        inputLabel: 'Postcode',
        errorMessage: 'Enter postcode'
      })
      expect(document.title).toMatch(/^Error: What is your address\? - /)
    })

    it('keeps the submitted values when re-showing the form with errors', async () => {
      const document = await loadErroredPage(
        {
          formVariant: 'agent',
          fullName: agentFullName,
          addressLine1: 'Development Road',
          postcode: 'DV1 6RP'
        },
        agentClaims
      )

      expect(getByLabelText(document, 'Full name')).toHaveValue(agentFullName)
      expect(getByLabelText(document, 'Address line 1')).toHaveValue(
        'Development Road'
      )
    })

    it('shows an error when the hidden variant field is missing or tampered with', async () => {
      const document = await loadErroredPage({})

      expect(
        getByRole(document, 'link', {
          name: 'Enter the details for the request to use'
        })
      ).toHaveAttribute('href', '#addressLine1')
    })
  })
})
