import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { routePath as whatWouldYouLikeToDoPath } from '../what-would-you-like-to-do/route-path.js'
import { assertContactDetails } from '../../../test-utils/assert-contact-details.js'
import { getResponse } from '../../../test-utils/get-response.js'
import { withCompleteQuoteSession } from '../../../test-utils/with-complete-quote-session.js'
import { withValidRetrieveQuoteSession } from '../../../test-utils/with-valid-retrieve-quote-session.js'
import { routePath as checkYourAnswersPath } from '../../quote/check-your-answers/route-path.js'
import { routePath as haveNrlReferencePath } from '../../request-to-use/have-nrl-reference/route-path.js'
import { routePath as enterNrlReferencePath } from '../../request-to-use/enter-nrl-reference/route-path.js'

describe('Start page', () => {
  const getServer = setupTestServer()

  it('should render a page heading', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(document.title).toBe('Nature restoration levy - GOV.UK')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature restoration levy'
    )
  })

  it('should link to a feedback survey from the beta banner', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const betaBanner = getByRole(document, 'region', { name: 'Give feedback' })
    const feedbackLink = getByRole(betaBanner, 'link', {
      name: 'give your feedback (opens in new tab)'
    })
    expect(feedbackLink).toHaveAttribute(
      'href',
      'https://defragroup.eu.qualtrics.com/jfe/form/SV_9yRhrdtbb3vmw86'
    )
  })

  it('should show contact details for help with the nature restoration levy', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    assertContactDetails(document)
  })

  it('should redirect to the what would you like to do page when the start form is submitted', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {}
    })
    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe(whatWouldYouLikeToDoPath)
  })

  describe('starting again after providing answers', () => {
    const startAgain = (cookie) =>
      submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: {},
        cookie
      })

    it('should leave no quote answers in the session', async () => {
      const cookie = await withCompleteQuoteSession(getServer())
      const { cookie: restartedCookie } = await startAgain(cookie)
      const response = await getResponse({
        server: getServer(),
        requestUrl: checkYourAnswersPath,
        cookie: restartedCookie
      })
      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(routePath)
    })

    it('should show empty pages when the journey is restarted', async () => {
      const server = getServer()
      let { cookie } = await submitForm({
        requestUrl: haveNrlReferencePath,
        server,
        formData: { hasNrlReference: 'yes' },
        cookie: await withValidRetrieveQuoteSession(server)
      })
      ;({ cookie } = await startAgain(cookie))
      ;({ cookie } = await submitForm({
        requestUrl: whatWouldYouLikeToDoPath,
        server,
        formData: { whatWouldYouLikeToDo: 'request-to-use' },
        cookie
      }))
      const document = await loadPage({
        requestUrl: haveNrlReferencePath,
        server,
        cookie
      })
      expect(getByLabelText(document, 'Yes')).not.toBeChecked()
    })

    it('should not treat earlier pages as completed', async () => {
      const server = getServer()
      const cookie = await withValidRetrieveQuoteSession(server)
      const { cookie: restartedCookie } = await startAgain(cookie)
      const response = await getResponse({
        server,
        requestUrl: enterNrlReferencePath,
        cookie: restartedCookie
      })
      expect(response.statusCode).toBe(statusCodes.found)
      expect(response.headers.location).toBe(routePath)
    })
  })
})
