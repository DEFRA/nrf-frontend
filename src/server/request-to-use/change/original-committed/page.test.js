import { getByRole } from '@testing-library/dom'
import { loadPage } from '../../../../test-utils/load-page.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import {
  expectBackToShowIncompleteAnswers,
  followBackLink
} from '../../../../test-utils/follow-back-link.js'
import { mockCompareBoundaries } from '../../../../test-utils/mock-get-quote.js'
import { originalNrlReference } from '../../../../test-utils/fixtures/quote.js'
import { setupChangePlanningPageTest } from '../../../../test-utils/setup-change-planning-page-test.js'

const pagePath = '/request-to-use/change/original-committed'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const changeOriginalReferencePath = '/request-to-use/change/original-reference'
const startPath = '/manage/start-page'
const originalCommittedKey =
  'Original planning permission committed to the levy'
const originalReferenceKey = 'Original NRL reference'

describe('Change whether the original planning permission was committed page', () => {
  const { getServer, mswServer, signedInCookie, seedSession, rowText } =
    setupChangePlanningPageTest()
  let sessionCookie

  beforeEach(async () => {
    seedSession({ variation: 'yes' })
    sessionCookie = await signedInCookie()
  })

  const submitOriginalCommitted = (originalCommitted, cookie = sessionCookie) =>
    submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { originalCommitted },
      cookie
    })

  it('redirects to the start page when there is no request to use session', async () => {
    seedSession(null)

    const response = await getResponse({
      server: getServer(),
      requestUrl: pagePath
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(startPath)
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

  it('shows the incomplete answers page after back when the answer is blank', async () => {
    await expectBackToShowIncompleteAnswers({
      requestUrl: pagePath,
      server: getServer(),
      cookie: sessionCookie
    })
  })

  it('shows the previous answer on the check your answers page after back without changing it', async () => {
    const { cookie } = await submitOriginalCommitted('no')

    const backPath = await followBackLink({
      requestUrl: pagePath,
      server: getServer(),
      cookie
    })

    expect(backPath).toBe(checkYourAnswersPath)
    expect(await rowText({ cookie, key: originalCommittedKey })).toBe('No')
  })

  it('redirects to the check your answers page when the answer is no', async () => {
    const { response } = await submitOriginalCommitted('no')

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('continues to the original reference change page when the answer is yes and there is no reference', async () => {
    const { response } = await submitOriginalCommitted('yes')

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(changeOriginalReferencePath)
  })

  it('returns to the check your answers page when the answer is yes and a reference is already saved', async () => {
    mockCompareBoundaries(mswServer)
    let { cookie } = await submitOriginalCommitted('yes')
    ;({ cookie } = await submitForm({
      requestUrl: changeOriginalReferencePath,
      server: getServer(),
      formData: { originalReference: originalNrlReference },
      cookie
    }))

    const { response } = await submitOriginalCommitted('yes', cookie)

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('shows the answer they continued with on the check your answers page', async () => {
    const { cookie } = await submitOriginalCommitted('no')

    expect(await rowText({ cookie, key: originalCommittedKey })).toBe('No')
    expect(await rowText({ cookie, key: originalReferenceKey })).toBe(
      'Not applicable'
    )
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
