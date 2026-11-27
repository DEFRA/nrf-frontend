import { getByRole } from '@testing-library/dom'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { setupSeededRequestToUseAnswers } from '../../../test-utils/setup-seeded-request-to-use-answers.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'
import {
  agentClaims,
  citizenClaims,
  singleOrgEmployeeClaims
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import {
  checkYourAnswersSessions,
  incompleteCheckYourAnswersSessions
} from '../../../test-utils/fixtures/check-your-answers-sessions.js'
import { reviewQuoteSession } from '../../../test-utils/fixtures/session.js'

const pagePath = '/request-to-use/read-this'
const pageHeading =
  'Details to read before you request to use the nature restoration levy'
const signInPath = '/auth/sign-in'
const startPath = '/manage/start-page'
const reviewDetailsPath = '/request-to-use/review-details'
const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

const { getServer, signIn } = setupSignedInTestServer()
const { setSession, signInWithAnswers } = setupSeededRequestToUseAnswers({
  getServer,
  signIn
})

// Each leaves one answer the steps before this page save blank. An address
// only counts while it was entered under the signed in Defra ID relationship.
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
    scenario: 'the NRL reference is missing',
    claims: citizenClaims,
    session: incompleteCheckYourAnswersSessions.withoutNrlReference
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

const personas = [
  {
    scenario: 'an agent',
    claims: agentClaims,
    session: checkYourAnswersSessions.agent
  },
  {
    scenario: 'an employee',
    claims: singleOrgEmployeeClaims,
    session: checkYourAnswersSessions.employee
  },
  {
    scenario: 'an individual',
    claims: citizenClaims,
    session: checkYourAnswersSessions.individual
  }
]

describe('Details to read before you request to use the nature restoration levy page', () => {
  it.each([
    ['no session', undefined],
    [
      'a session from the retrieve quote email link',
      reviewQuoteSession.requestToUse
    ]
  ])(
    'should redirect a signed-out visitor to sign in with %s',
    async (_, session) => {
      setSession(session)

      const response = await getResponse({
        server: getServer(),
        requestUrl: pagePath,
        cookie: session
          ? await withCompleteQuoteSession(getServer())
          : undefined
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(signInPath)
    }
  )

  it('should return a signed-out visitor to the page after signing in', async () => {
    setSession(checkYourAnswersSessions.individual)
    // The challenge's cookie carries the remembered path
    const challenge = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    const { response: returned, cookie } = await signIn({
      claims: citizenClaims,
      cookie: getYarCookie(challenge)
    })

    expect(returned.headers.location).toBe(pagePath)

    const document = await loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      pageHeading
    )
  })

  it('should redirect to the start page when there is no session', async () => {
    const { cookie } = await signIn({ claims: citizenClaims })

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  it.each(incompleteSessions)(
    'should redirect to the review and amend page when $scenario',
    async ({ claims, session }) => {
      const cookie = await signInWithAnswers({ claims, session })

      const response = await getResponse({
        server: getServer(),
        requestUrl: pagePath,
        cookie
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(reviewQuoteDetailsPath)

      const document = await loadPage({
        requestUrl: reviewQuoteDetailsPath,
        server: getServer(),
        cookie
      })
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        /^Review and amend the quote details/
      )
    }
  )

  it.each(personas)(
    'should load with no redirect when $scenario confirms their details',
    async ({ claims, session }) => {
      const cookie = await signInWithAnswers({ claims, session })

      const reviewDetails = await loadPage({
        requestUrl: reviewDetailsPath,
        server: getServer(),
        cookie
      })
      const confirmHref = getByRole(reviewDetails, 'button', {
        name: 'Confirm'
      }).getAttribute('href')

      const document = await loadPage({
        requestUrl: confirmHref,
        server: getServer(),
        cookie
      })
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        pageHeading
      )
    }
  )

  describe('when every earlier step is complete', () => {
    let cookie

    beforeEach(async () => {
      cookie = await signInWithAnswers({
        claims: citizenClaims,
        session: checkYourAnswersSessions.individual
      })
    })

    const load = () =>
      loadPage({ requestUrl: pagePath, server: getServer(), cookie })

    it('should render the heading and title', async () => {
      const document = await load()

      expect(document.title).toBe(
        'Details to read before you request to use the nature restoration levy - Nature restoration levy - GOV.UK'
      )
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        pageHeading
      )
    })

    it('should link back to the review details page', async () => {
      const document = await load()

      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        reviewDetailsPath
      )
    })

    it('should link continue to check your answers', async () => {
      const document = await load()

      expect(
        getByRole(document, 'button', { name: 'Continue' })
      ).toHaveAttribute('href', '/request-to-use/check-your-answers')
    })

    it('should show the recalculated levy amounts', async () => {
      const document = await load()

      expect(
        getByRole(document, 'heading', {
          level: 3,
          name: 'Provisional nature restoration levy amount: £26,750 (plus VAT)'
        })
      ).toBeInTheDocument()
      expect(
        getByRole(document, 'heading', {
          level: 3,
          name: 'Inflation-adjusted nature restoration levy amount: £27,123.50 (plus VAT)'
        })
      ).toBeInTheDocument()
    })

    it('should open the habitats regulations assessment guidance in a new tab', async () => {
      const document = await load()

      const link = getByRole(document, 'link', {
        name: 'habitats regulations assessment (opens in new tab)'
      })
      expect(link).toHaveAttribute(
        'href',
        'https://www.gov.uk/guidance/habitats-regulations-assessments-protecting-a-european-site'
      )
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should show the contact details with the NRL reference as the email subject', async () => {
      const document = await load()

      assertContactDetails(document, { mailtoSubject: 'NRL-123456' })
    })

    it('should use placeholder links for the guidance that is not published yet', async () => {
      const document = await load()

      const placeholderLinks = [
        'Read about the charging schedule for the EDP (opens in new tab)',
        'more information on handling commitments through the planning process (opens in new tab)',
        'Learn more about paying the nature restoration levy (opens in new tab)',
        'Read about nature restoration levy instalment plans (opens in new tab)'
      ]
      for (const name of placeholderLinks) {
        expect(getByRole(document, 'link', { name })).toHaveAttribute(
          'href',
          '#'
        )
      }
    })
  })
})
