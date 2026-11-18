import { getByRole, getByText } from '@testing-library/dom'
import { seedRequestToUseSessionWith } from '../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { mockCommitmentCertificate } from '../../../test-utils/mock-get-quote.js'
import { findSummaryListRowElement } from '../../../test-utils/find-summary-list-row.js'
import { expectFieldsetError } from '../../../test-utils/assertions.js'
import {
  agentClaims,
  citizenClaims,
  firstOrgName,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import {
  accountFullName,
  agentOrganisationName,
  developerFullName,
  reviewDetailsAddress,
  reviewDetailsSessions
} from '../../../test-utils/fixtures/review-details-personas.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const pagePath = '/request-to-use/check-your-answers'
const startPath = '/manage/start-page'

// The summary rows come from the persona snapshot and the signed-in user's
// own name, so the page tests sign in as each persona. The backend mocks are
// registered on the same msw server as the Defra ID handlers.
const { getServer: getAppServer, signIn, mswServer } = setupSignedInTestServer()

let seededSession = null
beforeAll(() => {
  seedRequestToUseSessionWith(getAppServer(), () => seededSession)
})

afterEach(() => {
  seededSession = null
})

const {
  agent: agentSession,
  employee: employeeSession,
  individual: individualSession
} = reviewDetailsSessions

// Summary list row keys (SonarQube S1192)
const rowKeys = {
  acceptLevyAmount: 'Accept levy amount',
  requestingToUseAs: 'Requesting to use the levy as',
  fullName: 'Full name',
  developerBusinessName: 'Developer business name',
  address: 'Address',
  planningPermissionType: 'Planning permission type',
  housing: 'Housing',
  housingUnits: 'Number of housing units',
  redLineBoundary: 'Red line boundary',
  emailAddress: 'Email address'
}

// Signs in as the persona over a completed quote session, so the page's guard
// sees both the saved quote and the request to use answers.
const loadSignedInPage = async ({ claims, session } = {}) => {
  if (session) {
    seededSession = session
  }
  const quoteCookie = await withCompleteQuoteSession(getAppServer())
  const { cookie } = await signIn({ claims, cookie: quoteCookie })
  return loadPage({ requestUrl: pagePath, server: getAppServer(), cookie })
}

const personaSession = (session) => ({
  ...session,
  nrlReference: fullQuote.reference,
  acceptLevy: 'yes'
})

// A quote session plus a Defra ID sign-in: the page requires sign-in to view
const signedInCookie = async (claims = citizenClaims) => {
  const quoteCookie = await withCompleteQuoteSession(getAppServer())
  const { cookie } = await signIn({ claims, cookie: quoteCookie })
  return cookie
}

describe('Check your answers page', () => {
  it('should redirect to the start page when there is no session', async () => {
    const { cookie } = await signIn({ claims: citizenClaims })

    const response = await getResponse({
      server: getAppServer(),
      requestUrl: pagePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  it('should redirect a signed-out visitor to sign in', async () => {
    const response = await getAppServer().inject({
      method: 'GET',
      url: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/auth/sign-in')
  })

  it('should render the heading, title and submit button', async () => {
    const document = await loadSignedInPage({
      claims: singleOrgEmployeeClaims,
      session: personaSession(employeeSession)
    })

    expect(document.title).toBe(
      'Check your answers - Nature restoration levy - GOV.UK'
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Check your answers'
    )
    expect(
      getByRole(document, 'button', { name: 'Confirm and submit' })
    ).toBeInTheDocument()
  })

  it('should link back to the read this page', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: personaSession(individualSession)
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/read-this'
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: personaSession(individualSession)
    })

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it.each([
    {
      scenario: 'an agent',
      claims: agentClaims,
      session: agentSession,
      userType: 'Agent',
      fullName: developerFullName,
      businessName: agentOrganisationName
    },
    {
      scenario: 'an employee',
      claims: singleOrgEmployeeClaims,
      session: employeeSession,
      userType: 'Employee',
      fullName: accountFullName,
      businessName: firstOrgName
    },
    {
      scenario: 'an individual',
      claims: citizenClaims,
      session: individualSession,
      userType: 'Individual',
      fullName: accountFullName,
      businessName: null
    }
  ])(
    'should show the summary rows for $scenario',
    async ({ claims, session, userType, fullName, businessName }) => {
      const document = await loadSignedInPage({
        claims,
        session: personaSession(session)
      })

      expect(
        findSummaryListRowElement(document, rowKeys.acceptLevyAmount)
      ).toHaveTextContent('Yes, accept this amount')

      const userTypeRow = findSummaryListRowElement(
        document,
        rowKeys.requestingToUseAs
      )
      expect(userTypeRow).toHaveTextContent(userType)
      expect(userTypeRow.querySelector('a')).toBeNull()

      expect(
        findSummaryListRowElement(document, rowKeys.fullName)
      ).toHaveTextContent(fullName)

      if (businessName) {
        const businessNameRow = findSummaryListRowElement(
          document,
          rowKeys.developerBusinessName
        )
        expect(businessNameRow).toHaveTextContent(businessName)
        expect(businessNameRow.querySelector('a')).toBeNull()
      } else {
        expect(
          findSummaryListRowElement(document, rowKeys.developerBusinessName)
        ).toBeUndefined()
      }

      const addressRow = findSummaryListRowElement(document, rowKeys.address)
      expect(addressRow).toHaveTextContent(reviewDetailsAddress.addressLine1)
      expect(addressRow).toHaveTextContent(reviewDetailsAddress.postcode)
    }
  )

  it('should link to the pages that change each answer', async () => {
    const document = await loadSignedInPage({
      claims: agentClaims,
      session: personaSession(agentSession)
    })

    expect(
      getByRole(document, 'link', {
        name: /whether you accept the levy amount/
      })
    ).toHaveAttribute('href', '/request-to-use/change/accept-levy')
    expect(getByRole(document, 'link', { name: /full name/ })).toHaveAttribute(
      'href',
      '/request-to-use/change/enter-address'
    )
    expect(
      getByRole(document, 'link', { name: /^Change\s*address$/ })
    ).toHaveAttribute('href', '/request-to-use/change/enter-address')
  })

  it('should show the development details of the saved quote', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: personaSession(individualSession)
    })

    expect(
      findSummaryListRowElement(document, rowKeys.planningPermissionType)
    ).toHaveTextContent('Full planning permission')
    expect(
      findSummaryListRowElement(document, rowKeys.housing)
    ).toHaveTextContent('Yes')
    expect(
      findSummaryListRowElement(document, rowKeys.housingUnits)
    ).toHaveTextContent('42')
    expect(
      findSummaryListRowElement(document, rowKeys.redLineBoundary)
    ).toHaveTextContent('Added')
    expect(
      findSummaryListRowElement(document, rowKeys.emailAddress)
    ).toHaveTextContent('test@example.com')
  })

  it('should link to the review and amend page to update the development details', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: personaSession(individualSession)
    })

    expect(
      getByRole(document, 'link', { name: 'review your quote' })
    ).toHaveAttribute('href', '/request-to-use/review-quote-details')
  })

  it('should show the recalculation warning', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: personaSession(individualSession)
    })

    expect(
      getByText(
        document,
        'Updates may result in a recalculation of available capacity and the levy amount.'
      )
    ).toBeInTheDocument()
  })

  it('should link to the delete quote page', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: personaSession(individualSession)
    })

    expect(
      getByRole(document, 'link', { name: /^Delete\s*quote details$/ })
    ).toHaveAttribute('href', '/request-to-use/change/delete-quote-details')
  })

  it('should record the commitment certificate and redirect to the confirmation page on submit', async () => {
    const requests = mockCommitmentCertificate(mswServer)
    seededSession = { nrlReference: fullQuote.reference }

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getAppServer(),
      formData: { confirmInformation: 'Yes' },
      cookie: await signedInCookie()
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/request-to-use/confirmation')
    expect(requests).toEqual([{ createCommitmentCertificate: true }])
  })

  it('should redirect back with a validation error when the confirmation box is not ticked', async () => {
    seededSession = personaSession(employeeSession)
    const cookie = await signedInCookie(singleOrgEmployeeClaims)

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getAppServer(),
      formData: {},
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(pagePath)

    const document = await loadPage({
      requestUrl: pagePath,
      server: getAppServer(),
      cookie
    })

    expect(document.title).toBe(
      'Error: Check your answers - Nature restoration levy - GOV.UK'
    )
    expectFieldsetError({
      document,
      errorMessage:
        'Tick the box to confirm the information is true, accurate and complete'
    })
  })

  it('should redirect to the start page without calling the backend when there is no session', async () => {
    const requests = mockCommitmentCertificate(mswServer)
    const { cookie } = await signIn({ claims: citizenClaims })

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getAppServer(),
      formData: { confirmInformation: 'Yes' },
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(startPath)
    expect(requests).toEqual([])
  })

  it.each([404, 409, 500])(
    'should show the 500 error page when the backend responds with %i',
    async (status) => {
      mockCommitmentCertificate(mswServer, { status })
      seededSession = { nrlReference: fullQuote.reference }

      const { response, document } = await submitForm({
        requestUrl: pagePath,
        server: getAppServer(),
        formData: { confirmInformation: 'Yes' },
        cookie: await signedInCookie()
      })

      expect(response.statusCode).toBe(500)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Sorry, there is a problem with the service'
      )
    }
  )
})
