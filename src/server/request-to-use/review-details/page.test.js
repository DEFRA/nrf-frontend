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
import {
  accountFullName,
  agentOrganisationName,
  developerFullName,
  reviewDetailsAddress,
  reviewDetailsSessions
} from '../../../test-utils/fixtures/review-details-personas.js'
import { findSummaryListRowElement } from '../../../test-utils/find-summary-list-row.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'

const ROUTE_PATH = '/request-to-use/review-details'
const ENTER_ADDRESS_PATH = '/request-to-use/enter-address'
const { getServer, signIn } = setupSignedInTestServer()

const {
  agent: agentSession,
  employee: employeeSession,
  individual: individualSession
} = reviewDetailsSessions

// Summary list row keys (SonarQube S1192)
const rowKeys = {
  fullName: 'Full name',
  businessName: 'Business name',
  address: 'Address'
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

describe('Review and confirm the developer details page', () => {
  it('redirects a signed-out visitor to sign in', async () => {
    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/auth/sign-in')
  })

  it('redirects a visitor with no saved address to the enter address page', async () => {
    const { cookie } = await signIn()
    seededSession = { signin: { actualUserType: 'individual' } }

    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ENTER_ADDRESS_PATH)
  })

  it('redirects to the enter address page when the saved address was entered under a different relationship', async () => {
    const { cookie } = await signIn({ claims: singleOrgEmployeeClaims })
    seededSession = {
      ...employeeSession,
      signin: { ...employeeSession.signin, relationshipId: 'another-rel-id' }
    }

    const response = await getServer().inject({
      method: 'GET',
      url: ROUTE_PATH,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ENTER_ADDRESS_PATH)
  })

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

        expect(
          findSummaryListRowElement(document, rowKeys.fullName)
        ).toHaveTextContent(fullName)
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
          expect(
            findSummaryListRowElement(document, rowKeys.businessName)
          ).toHaveTextContent(businessName)
          if (canChangeBusinessName) {
            expect(
              getByRole(document, 'link', { name: /the business name/ })
            ).toHaveAttribute(
              'href',
              '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Freview-details'
            )
          }
        } else {
          expect(
            findSummaryListRowElement(document, rowKeys.businessName)
          ).toBeUndefined()
        }

        expect(
          findSummaryListRowElement(document, rowKeys.address)
        ).toHaveTextContent(reviewDetailsAddress.addressLine1)
        expect(
          findSummaryListRowElement(document, rowKeys.address)
        ).toHaveTextContent(reviewDetailsAddress.postcode)
        expect(
          getByRole(document, 'link', {
            name: /the developer's address|your address/
          })
        ).toHaveAttribute('href', ENTER_ADDRESS_PATH)
      }
    )
  })

  it('links back to the enter address page', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: individualSession
    })

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
      const document = await loadSignedInPage({
        claims: citizenClaims,
        session: individualSession
      })

      expect(
        queryByTestId(document, 'app-organisation-heading')
      ).not.toBeInTheDocument()
      expect(
        queryByRole(document, 'link', { name: 'Change organisation' })
      ).not.toBeInTheDocument()
    })
  })

  it('confirms with a button link to the details to read page', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: individualSession
    })

    expect(getByRole(document, 'button', { name: 'Confirm' })).toHaveAttribute(
      'href',
      '/request-to-use/read-this'
    )
    expect(
      document.querySelector('form[action="/request-to-use/review-details"]')
    ).not.toBeInTheDocument()
  })

  describe('changing an answer from a change link', () => {
    const changedAddress = {
      ...reviewDetailsAddress,
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
          formData: { formVariant, fullName, ...reviewDetailsAddress },
          cookie
        })

        const firstView = await loadPage({
          requestUrl: ROUTE_PATH,
          server: getServer(),
          cookie: savedCookie
        })
        expect(
          findSummaryListRowElement(firstView, rowKeys.address)
        ).toHaveTextContent(reviewDetailsAddress.addressLine1)

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
        expect(
          findSummaryListRowElement(secondView, rowKeys.address)
        ).toHaveTextContent(changedAddress.addressLine1)
        expect(
          findSummaryListRowElement(secondView, rowKeys.address)
        ).toHaveTextContent(changedAddress.townOrCity)
        if (changedFullName) {
          expect(
            findSummaryListRowElement(secondView, rowKeys.fullName)
          ).toHaveTextContent(changedFullName)
        }
      }
    )
  })
})
