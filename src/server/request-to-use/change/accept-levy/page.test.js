import { getByRole } from '@testing-library/dom'
import { setupMswServer } from '../../../../test-utils/setup-msw-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import { mockRecalculateLevy } from '../../../../test-utils/mock-recalculate-levy.js'

// Declared as literals rather than imports: a wrong change to a route must
// fail these tests (tests.md, constants vs literals).
const ROUTE_PATH = '/request-to-use/change/accept-levy'
const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

const mswServer = setupMswServer()

describe('Change whether the levy amount is accepted page', () => {
  const getServer = setupSeededRequestToUseServer()
  let sessionCookie

  beforeEach(async () => {
    mockRecalculateLevy(mswServer)
    const { cookie } = await submitForm({
      requestUrl: reviewQuoteDetailsPath,
      server: getServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getServer())
    })
    sessionCookie = cookie
  })

  it('links back to the check your answers page', async () => {
    const document = await loadPage({
      requestUrl: ROUTE_PATH,
      server: getServer(),
      cookie: sessionCookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/check-your-answers?change=true'
    )
  })

  it.each([
    {
      scenario: 'accepted again',
      answer: 'yes',
      nextPage: '/request-to-use/check-your-answers'
    },
    {
      scenario:
        'declined, which still takes the delete quote path, at its change alias',
      answer: 'no',
      nextPage: '/request-to-use/change/delete-quote'
    }
  ])(
    'should redirect to $nextPage when the levy amount is $scenario',
    async ({ answer, nextPage }) => {
      const { response } = await submitForm({
        requestUrl: ROUTE_PATH,
        server: getServer(),
        formData: { acceptLevy: answer },
        cookie: sessionCookie
      })

      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe(nextPage)
    }
  )
})
