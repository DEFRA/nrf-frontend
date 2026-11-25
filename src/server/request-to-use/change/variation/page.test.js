import { getByRole } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const pagePath = '/request-to-use/change/variation'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const changeOriginalCommittedPath = '/request-to-use/change/original-committed'

describe('Change whether the development is an amendment page', () => {
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

  it('redirects to the check your answers page when the answer is no', async () => {
    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'no' },
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('continues to the original committed change page when the answer is yes and the original permission is unanswered', async () => {
    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'yes' },
      cookie: sessionCookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(changeOriginalCommittedPath)
  })

  it('returns to the check your answers page when the answer is yes and the original permission is already answered', async () => {
    let { cookie } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'yes' },
      cookie: sessionCookie
    })
    ;({ cookie } = await submitForm({
      requestUrl: changeOriginalCommittedPath,
      server: getServer(),
      formData: { originalCommitted: 'no' },
      cookie
    }))

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'yes' },
      cookie
    })

    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('discards the original permission answers when the answer changes to no, so a later yes asks again', async () => {
    let { cookie } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'yes' },
      cookie: sessionCookie
    })
    ;({ cookie } = await submitForm({
      requestUrl: changeOriginalCommittedPath,
      server: getServer(),
      formData: { originalCommitted: 'no' },
      cookie
    }))
    ;({ cookie } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'no' },
      cookie
    }))

    const { response } = await submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation: 'yes' },
      cookie
    })

    expect(response.headers.location).toBe(changeOriginalCommittedPath)
  })

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
