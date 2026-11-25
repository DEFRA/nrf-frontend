import { getByRole, getByText, queryByRole } from '@testing-library/dom'
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
  reviewDetailsAddress
} from '../../../test-utils/fixtures/review-details-personas.js'
import {
  checkYourAnswersSessions,
  incompleteCheckYourAnswersSessions
} from '../../../test-utils/fixtures/check-your-answers-sessions.js'
import { recalculatedLevy } from '../../../test-utils/fixtures/levy.js'

const pagePath = '/request-to-use/check-your-answers'
const startPath = '/manage/start-page'
const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'
const incompleteAnswersHeading = 'Your details are incomplete'
const acceptLevyPath = '/request-to-use/accept-levy'

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

// Seeds the request to use answers, then signs in as the persona over a
// completed quote session, so the page's guard sees both the saved quote and
// the answers.
const signInWithAnswers = async ({ claims, session }) => {
  seededSession = session
  const quoteCookie = await withCompleteQuoteSession(getAppServer())
  const { cookie } = await signIn({ claims, cookie: quoteCookie })
  return cookie
}

const loadSignedInPage = async ({ claims, session }) => {
  const cookie = await signInWithAnswers({ claims, session })
  return loadPage({ requestUrl: pagePath, server: getAppServer(), cookie })
}

// Each leaves one answer the page confirms blank. An address only counts
// while it was entered under the signed in Defra ID relationship.
const incompleteSessions = [
  {
    scenario: 'the levy calculation is missing',
    claims: citizenClaims,
    session: incompleteCheckYourAnswersSessions.withoutLevyCalculation
  },
  {
    scenario: 'the levy amount has not been accepted',
    claims: citizenClaims,
    session: incompleteCheckYourAnswersSessions.withoutAcceptedLevy
  },
  {
    scenario: 'the address was entered under another Defra ID account',
    claims: citizenClaims,
    session: incompleteCheckYourAnswersSessions.addressForAnotherAccount
  },
  {
    scenario: 'an agent has not entered the full name',
    claims: agentClaims,
    session: incompleteCheckYourAnswersSessions.agentWithoutFullName
  }
]

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

  it('should redirect a signed-out submit to sign in', async () => {
    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getAppServer(),
      formData: { confirmInformation: 'Yes' }
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/auth/sign-in')
  })

  it('should render the heading, title and submit button', async () => {
    const document = await loadSignedInPage({
      claims: singleOrgEmployeeClaims,
      session: checkYourAnswersSessions.employee
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
      session: checkYourAnswersSessions.individual
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/read-this'
    )
  })

  it('should contain a CSRF token in the form', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: checkYourAnswersSessions.individual
    })

    expect(
      document.querySelector('form input[name="csrfToken"]')
    ).toBeInTheDocument()
  })

  it.each(incompleteSessions)(
    'should show the incomplete answers page when $scenario',
    async ({ claims, session }) => {
      const cookie = await signInWithAnswers({ claims, session })

      const response = await getResponse({
        server: getAppServer(),
        requestUrl: pagePath,
        cookie
      })
      expect(response.statusCode).toBe(400)

      const document = await loadPage({
        requestUrl: pagePath,
        server: getAppServer(),
        cookie
      })
      expect(document.title).toBe(
        `${incompleteAnswersHeading} - Nature restoration levy - GOV.UK`
      )
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        incompleteAnswersHeading
      )
      expect(getByRole(document, 'main')).toHaveTextContent(
        'Use the Manage the nature restoration levy service and complete all the details.'
      )
      expect(
        getByRole(document, 'link', {
          name: 'Manage the nature restoration levy'
        })
      ).toHaveAttribute('href', reviewQuoteDetailsPath)
      expect(queryByRole(document, 'link', { name: 'Back' })).toBeNull()
      expect(
        queryByRole(document, 'button', { name: 'Confirm and submit' })
      ).toBeNull()
    }
  )

  it.each([
    {
      scenario: 'an agent',
      claims: agentClaims,
      session: checkYourAnswersSessions.agent,
      userType: 'A client you act for as an agent or third party',
      fullName: developerFullName,
      businessName: agentOrganisationName,
      hasFullNameLink: true
    },
    {
      scenario: 'an employee',
      claims: singleOrgEmployeeClaims,
      session: checkYourAnswersSessions.employee,
      userType: 'The business or organisation you work for',
      fullName: accountFullName,
      businessName: firstOrgName,
      hasFullNameLink: false
    },
    {
      scenario: 'an individual',
      claims: citizenClaims,
      session: checkYourAnswersSessions.individual,
      userType: 'Yourself, as an individual',
      fullName: accountFullName,
      businessName: null,
      hasFullNameLink: false
    }
  ])(
    'should show the summary rows for $scenario',
    async ({
      claims,
      session,
      userType,
      fullName,
      businessName,
      hasFullNameLink
    }) => {
      const document = await loadSignedInPage({ claims, session })

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
      expect(
        Boolean(
          queryByRole(
            findSummaryListRowElement(document, rowKeys.fullName),
            'link'
          )
        )
      ).toBe(hasFullNameLink)

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
      session: checkYourAnswersSessions.agent
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
      session: checkYourAnswersSessions.individual
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
      session: checkYourAnswersSessions.individual
    })

    expect(
      getByRole(document, 'link', { name: 'review your quote' })
    ).toHaveAttribute('href', reviewQuoteDetailsPath)
  })

  it('should show the recalculation warning', async () => {
    const document = await loadSignedInPage({
      claims: citizenClaims,
      session: checkYourAnswersSessions.individual
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
      session: checkYourAnswersSessions.individual
    })

    expect(
      getByRole(document, 'link', { name: /^Delete\s*quote details$/ })
    ).toHaveAttribute('href', '/request-to-use/change/delete-quote-details')
  })

  it('should record the commitment certificate and redirect to the confirmation page on submit', async () => {
    const requests = mockCommitmentCertificate(mswServer)

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getAppServer(),
      formData: { confirmInformation: 'Yes' },
      cookie: await signInWithAnswers({
        claims: singleOrgEmployeeClaims,
        session: checkYourAnswersSessions.employee
      })
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/request-to-use/confirmation')
    expect(requests).toEqual([
      { createCommitmentCertificate: true, levy: recalculatedLevy }
    ])
  })

  it.each([
    { scenario: 'there is no session', claims: citizenClaims, session: null },
    ...incompleteSessions
  ])(
    'should show the incomplete answers page without calling the backend on submit when $scenario',
    async ({ claims, session }) => {
      const requests = mockCommitmentCertificate(mswServer)

      const { response, document } = await submitForm({
        requestUrl: pagePath,
        server: getAppServer(),
        formData: { confirmInformation: 'Yes' },
        cookie: await signInWithAnswers({ claims, session })
      })

      expect(response.statusCode).toBe(400)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        incompleteAnswersHeading
      )
      expect(requests).toEqual([])
    }
  )

  it('should redirect back with a validation error when the confirmation box is not ticked', async () => {
    const cookie = await signInWithAnswers({
      claims: singleOrgEmployeeClaims,
      session: checkYourAnswersSessions.employee
    })

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

  it('should not show the validation error on the next form page when the answers are incomplete', async () => {
    const cookie = await signInWithAnswers({
      claims: singleOrgEmployeeClaims,
      session: checkYourAnswersSessions.employee
    })

    // The seed is saved after a response, so this request is what makes the
    // answers incomplete behind the form the user has open
    seededSession = incompleteCheckYourAnswersSessions.addressForAnotherAccount
    const openForm = await loadPage({
      requestUrl: pagePath,
      server: getAppServer(),
      cookie
    })
    expect(openForm.title).toBe(
      'Check your answers - Nature restoration levy - GOV.UK'
    )

    const { response, cookie: submittedCookie } = await submitForm({
      requestUrl: pagePath,
      server: getAppServer(),
      formData: {},
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(pagePath)

    const errorPage = await loadPage({
      requestUrl: pagePath,
      server: getAppServer(),
      cookie: submittedCookie
    })
    expect(errorPage.title).toBe(
      `${incompleteAnswersHeading} - Nature restoration levy - GOV.UK`
    )

    const nextPage = await loadPage({
      requestUrl: acceptLevyPath,
      server: getAppServer(),
      cookie: submittedCookie
    })
    expect(nextPage.title).toBe(
      'Do you accept this nature restoration levy amount? - Nature restoration levy - GOV.UK'
    )
    expect(queryByRole(nextPage, 'alert')).toBeNull()
  })

  it.each([404, 409, 500])(
    'should show the 500 error page when the backend responds with %i',
    async (status) => {
      mockCommitmentCertificate(mswServer, { status })

      const { response, document } = await submitForm({
        requestUrl: pagePath,
        server: getAppServer(),
        formData: { confirmInformation: 'Yes' },
        cookie: await signInWithAnswers({
          claims: singleOrgEmployeeClaims,
          session: checkYourAnswersSessions.employee
        })
      })

      expect(response.statusCode).toBe(500)
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Sorry, there is a problem with the service'
      )
    }
  )
})
