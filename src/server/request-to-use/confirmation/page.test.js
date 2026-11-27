import { getByRole, queryByRole } from '@testing-library/dom'
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { setupSeededRequestToUseAnswers } from '../../../test-utils/setup-seeded-request-to-use-answers.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { getYarCookie } from '../../../test-utils/yar-cookie.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { mockCommitmentCertificate } from '../../../test-utils/mock-get-quote.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'
import { expectPhaseBannerSurveyLink } from '../../../test-utils/assertions.js'
import { singleOrgEmployeeClaims } from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { checkYourAnswersSessions } from '../../../test-utils/fixtures/check-your-answers-sessions.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import { reviewQuoteSession } from '../../../test-utils/fixtures/session.js'
import { requestToUseSurveyUrl } from '../../../test-utils/fixtures/survey.js'

const pagePath = '/request-to-use/confirmation'
const pageHeading = 'Your details have been submitted'
const signInPath = '/auth/sign-in'
const startPath = '/manage/start-page'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const contactIntroSuffix = ' and give the NRL reference number'
const whatHappensNext =
  "You will be sent an email with a commitment certificate that you can send to your local planning authority to include with your planning application. You should receive the email today, if you don't receive it, check your spam or junk folder."

const { getServer, signIn, mswServer } = setupSignedInTestServer()
const { setSession, signInWithAnswers } = setupSeededRequestToUseAnswers({
  getServer,
  signIn
})

describe('Your details have been submitted page', () => {
  // Sign-in comes first, whether or not a session from the retrieve quote
  // email link has been started
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
    setSession(checkYourAnswersSessions.employee)

    const challenge = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    const { response: returned, cookie } = await signIn({
      claims: singleOrgEmployeeClaims,
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
    const { cookie } = await signIn({ claims: singleOrgEmployeeClaims })

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
  })

  describe('when the request to use answers are complete', () => {
    let cookie

    beforeEach(async () => {
      cookie = await signInWithAnswers({
        claims: singleOrgEmployeeClaims,
        session: checkYourAnswersSessions.employee
      })
    })

    const load = () =>
      loadPage({ requestUrl: pagePath, server: getServer(), cookie })

    it('should render the heading and title', async () => {
      const document = await load()

      expect(document.title).toBe(
        'Your details have been submitted - Nature restoration levy - GOV.UK'
      )
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        pageHeading
      )
    })

    it('should not show a back link', async () => {
      const document = await load()

      expect(
        queryByRole(document, 'link', { name: 'Back' })
      ).not.toBeInTheDocument()
    })

    it('should show the NRL reference of the request in the panel', async () => {
      const document = await load()

      expect(getByRole(document, 'main')).toHaveTextContent(
        `NRL reference: ${fullQuote.reference}`
      )
    })

    it('should say what happens next', async () => {
      const document = await load()

      expect(
        getByRole(document, 'heading', { level: 2, name: 'What happens next' })
      ).toBeInTheDocument()
      expect(getByRole(document, 'main')).toHaveTextContent(whatHappensNext)
    })

    it('should show how to get help and ask for the NRL reference', async () => {
      const document = await load()

      assertContactDetails(document, { introSuffix: contactIntroSuffix })
    })

    it('should open the request to use survey in a new tab from the page', async () => {
      const document = await load()

      const link = getByRole(document, 'link', {
        name: 'What do you think of this service? (opens in new tab)'
      })
      expect(link).toHaveAttribute('href', requestToUseSurveyUrl)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should link to the request to use survey from the beta banner', async () => {
      expectPhaseBannerSurveyLink({
        document: await load(),
        journey: 'RequestToUse'
      })
    })

    it('should be reached by submitting the check your answers page', async () => {
      mockCommitmentCertificate(mswServer)

      const { response, cookie: submittedCookie } = await submitForm({
        requestUrl: checkYourAnswersPath,
        server: getServer(),
        formData: { confirmInformation: 'Yes' },
        cookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(pagePath)

      const document = await loadPage({
        requestUrl: response.headers.location,
        server: getServer(),
        cookie: submittedCookie
      })

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        pageHeading
      )
      expect(getByRole(document, 'main')).toHaveTextContent(
        `NRL reference: ${fullQuote.reference}`
      )
    })
  })
})
