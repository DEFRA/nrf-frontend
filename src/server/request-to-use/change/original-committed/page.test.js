import { getByRole } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const pagePath = '/request-to-use/change/original-committed'
const checkYourAnswersPath = '/request-to-use/check-your-answers'

describe('Change whether the original planning permission was committed page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await withCompleteQuoteSession(getServer())
  })

  it('links back to the check your answers page', async () => {
    const document = await loadPage({
      requestUrl: pagePath,
      server: getServer(),
      cookie: sessionCookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      checkYourAnswersPath
    )
  })

  it.each(['yes', 'no'])(
    'redirects to the check your answers page when the answer is %s',
    async (originalCommitted) => {
      const { response } = await submitForm({
        requestUrl: pagePath,
        server: getServer(),
        formData: { originalCommitted },
        cookie: sessionCookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(checkYourAnswersPath)
    }
  )

  it('redirects back to the form when no answer is selected', async () => {
    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: {},
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(pagePath)
  })
})
