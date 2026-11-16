import {
  getByRole,
  getByTestId,
  queryByRole,
  queryByTestId
} from '@testing-library/dom'

import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import {
  agentClaims,
  citizenClaims,
  firstOrgName,
  multiOrgEmployeeClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'

const ROUTE_PATH = '/request-to-use/review-details'
const ENTER_ADDRESS_PATH = '/request-to-use/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

const agentOrganisationName = 'CDP Beneficiary Org'

const validAddress = {
  addressLine1: '1 Development Road',
  addressLine2: 'Building 2',
  townOrCity: 'Development',
  county: 'Devonshire',
  postcode: 'DV1 6RP'
}

const developerFullName = 'Trevor Barker'
const accountFullName = 'Test User'

// Summary list row keys (SonarQube S1192)
const rowKeys = {
  fullName: 'Full name',
  businessName: 'Business name',
  address: 'Address'
}

const agentSession = {
  address: { ...validAddress, fullName: developerFullName },
  signin: {
    actualUserType: 'agent',
    organisation: { organisationName: agentOrganisationName }
  }
}

const employeeSession = {
  address: { ...validAddress, fullName: '' },
  signin: {
    actualUserType: 'employee',
    organisation: { organisationName: firstOrgName }
  }
}

const individualSession = {
  address: { ...validAddress, fullName: '' },
  signin: {
    actualUserType: 'individual',
    organisation: { organisationName: '' }
  }
}

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

/**
 * Finds the summary list row whose key matches, so value text and change
 * links can be asserted within the right row.
 * @param {Document} document - the loaded page
 * @param {string} key - the row's key text
 * @returns {HTMLElement | undefined} the row element
 */
const findRow = (document, key) =>
  Array.from(document.querySelectorAll('.govuk-summary-list__row')).find(
    (row) =>
      row.querySelector('.govuk-summary-list__key')?.textContent.trim() === key
  )

describe('Review and confirm the developer details page', () => {
  it('redirects a signed-out visitor to sign in', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/auth/sign-in')
  })

  it.each(['GET', 'POST'])(
    'redirects a visitor with no saved address to the enter address page on %s',
    async (method) => {
      const { cookie } = await signIn()
      seededSession = { signin: { actualUserType: 'individual' } }

      const response = await getServer().inject({
        method,
        url: ROUTE_PATH,
        payload: method === 'POST' ? {} : undefined,
        headers: { cookie }
      })

      expect(response.statusCode).toBe(method === 'GET' ? 302 : 303)
      expect(response.headers.location).toBe(ENTER_ADDRESS_PATH)
    }
  )

  describe('variants', () => {
    it.each([
      {
        scenario: 'for an agent',
        claims: agentClaims,
        session: agentSession,
        heading: 'Review and confirm the developer details',
        sectionHeading: 'Developer details',
        fullName: developerFullName,
        businessName: agentOrganisationName,
        canChangeFullName: true,
        canChangeBusinessName: true
      },
      {
        scenario: 'for an employee',
        claims: singleOrgEmployeeClaims,
        session: employeeSession,
        heading: 'Review and confirm your details',
        sectionHeading: 'Your details',
        fullName: accountFullName,
        businessName: firstOrgName,
        canChangeFullName: false,
        canChangeBusinessName: false
      },
      {
        scenario: 'for an individual',
        claims: citizenClaims,
        session: individualSession,
        heading: 'Review and confirm your details',
        sectionHeading: 'Your details',
        fullName: accountFullName,
        businessName: null,
        canChangeFullName: false,
        canChangeBusinessName: false
      }
    ])(
      'reviews the details $scenario',
      async ({
        claims,
        session,
        heading,
        sectionHeading,
        fullName,
        businessName,
        canChangeFullName,
        canChangeBusinessName
      }) => {
        const document = await loadSignedInPage({ claims, session })

        expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
          heading
        )
        expect(
          getByRole(document, 'heading', { level: 2, name: sectionHeading })
        ).toBeInTheDocument()
        expect(document.title).toBe(
          `${heading} - Nature restoration levy - GOV.UK`
        )

        expect(findRow(document, rowKeys.fullName)).toHaveTextContent(fullName)
        if (canChangeFullName) {
          expect(
            getByRole(document, 'link', { name: /the developer's full name/ })
          ).toHaveAttribute('href', ENTER_ADDRESS_PATH)
        } else {
          expect(
            queryByRole(document, 'link', { name: /full name/ })
          ).not.toBeInTheDocument()
        }

        if (businessName) {
          expect(findRow(document, rowKeys.businessName)).toHaveTextContent(
            businessName
          )
          if (canChangeBusinessName) {
            expect(
              getByRole(document, 'link', { name: /the business name/ })
            ).toHaveAttribute(
              'href',
              '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Freview-details'
            )
          }
        } else {
          expect(findRow(document, rowKeys.businessName)).toBeUndefined()
        }

        expect(findRow(document, rowKeys.address)).toHaveTextContent(
          validAddress.addressLine1
        )
        expect(findRow(document, rowKeys.address)).toHaveTextContent(
          validAddress.postcode
        )
        expect(
          getByRole(document, 'link', {
            name: /the developer's address|your address/
          })
        ).toHaveAttribute('href', ENTER_ADDRESS_PATH)
      }
    )
  })

  it('links back to the enter address page', async () => {
    const document = await loadSignedInPage({ session: individualSession })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      ENTER_ADDRESS_PATH
    )
  })

  describe('organisation heading', () => {
    it('shows the organisation switcher above the page heading', async () => {
      const document = await loadSignedInPage({
        claims: multiOrgEmployeeClaims,
        session: employeeSession
      })

      expect(
        getByTestId(document, 'app-organisation-heading')
      ).toHaveTextContent(firstOrgName)
      expect(
        getByRole(document, 'link', { name: 'Change organisation' })
      ).toHaveAttribute(
        'href',
        '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Freview-details'
      )
    })

    it('does not offer to change organisation when there is nothing to switch to', async () => {
      const document = await loadSignedInPage({ session: individualSession })

      expect(
        queryByTestId(document, 'app-organisation-heading')
      ).not.toBeInTheDocument()
      expect(
        queryByRole(document, 'link', { name: 'Change organisation' })
      ).not.toBeInTheDocument()
    })
  })

  it('contains a CSRF token in the form', async () => {
    const document = await loadSignedInPage({ session: individualSession })

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  describe('confirming the details', () => {
    it.each([
      ['an agent', agentClaims, agentSession],
      ['an employee', singleOrgEmployeeClaims, employeeSession],
      ['an individual', citizenClaims, individualSession]
    ])(
      'redirects %s to the details to read page',
      async (_, claims, session) => {
        seededSession = session
        const { cookie } = await signIn({ claims })

        const { response } = await submitForm({
          requestUrl: ROUTE_PATH,
          server: getServer(),
          formData: {},
          cookie
        })

        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe('/request-to-use/read-this')
      }
    )
  })

  describe('changing an answer from a change link', () => {
    const changedAddress = {
      ...validAddress,
      addressLine1: '2 Amended Street',
      townOrCity: 'Amended'
    }

    it.each([
      {
        scenario: 'an agent',
        claims: agentClaims,
        formVariant: 'agent',
        fullName: developerFullName,
        changedFullName: 'Amber Barker',
        session: agentSession
      },
      {
        scenario: 'an employee',
        claims: singleOrgEmployeeClaims,
        formVariant: 'employee',
        fullName: undefined,
        session: employeeSession
      },
      {
        scenario: 'an individual',
        claims: citizenClaims,
        formVariant: 'individual',
        fullName: undefined,
        session: individualSession
      }
    ])(
      'shows the amended answers for $scenario after continuing from the enter address page',
      async ({ claims, formVariant, fullName, changedFullName }) => {
        // The enter address page is what every change link opens; its confirm
        // returns here, so the round trip goes through the real POST.
        const { cookie } = await signIn({ claims })
        const { cookie: savedCookie } = await submitForm({
          requestUrl: ENTER_ADDRESS_PATH,
          server: getServer(),
          formData: { formVariant, fullName, ...validAddress },
          cookie
        })

        const firstView = await loadPage({
          requestUrl: ROUTE_PATH,
          server: getServer(),
          cookie: savedCookie
        })
        expect(findRow(firstView, rowKeys.address)).toHaveTextContent(
          validAddress.addressLine1
        )

        const { cookie: changedCookie } = await submitForm({
          requestUrl: ENTER_ADDRESS_PATH,
          server: getServer(),
          formData: {
            formVariant,
            fullName: changedFullName ?? fullName,
            ...changedAddress
          },
          cookie: savedCookie
        })

        const secondView = await loadPage({
          requestUrl: ROUTE_PATH,
          server: getServer(),
          cookie: changedCookie
        })
        expect(findRow(secondView, rowKeys.address)).toHaveTextContent(
          changedAddress.addressLine1
        )
        expect(findRow(secondView, rowKeys.address)).toHaveTextContent(
          changedAddress.townOrCity
        )
        if (changedFullName) {
          expect(findRow(secondView, rowKeys.fullName)).toHaveTextContent(
            changedFullName
          )
        }
      }
    )
  })
})
