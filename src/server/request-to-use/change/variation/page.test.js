import { getByRole } from '@testing-library/dom'
import { loadPage } from '../../../../test-utils/load-page.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import {
  expectBackToShowIncompleteAnswers,
  followBackLink
} from '../../../../test-utils/follow-back-link.js'
import { setupChangePlanningPageTest } from '../../../../test-utils/setup-change-planning-page-test.js'

const pagePath = '/request-to-use/change/variation'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const checkYourAnswersBackLink =
  '/request-to-use/check-your-answers?change=true'
const changeOriginalCommittedPath = '/request-to-use/change/original-committed'
const startPath = '/manage/start-page'
const variationKey = 'Amendment to an existing planning permission'
const originalCommittedKey =
  'Original planning permission committed to the levy'

describe('Change whether the development is an amendment page', () => {
  const { getServer, signedInCookie, seedSession, rowText } =
    setupChangePlanningPageTest()
  let sessionCookie

  beforeEach(async () => {
    sessionCookie = await signedInCookie()
  })

  const submitVariation = (variation, cookie = sessionCookie) =>
    submitForm({
      requestUrl: pagePath,
      server: getServer(),
      formData: { variation },
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
      checkYourAnswersBackLink
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
    const { cookie } = await submitVariation('no')

    const backPath = await followBackLink({
      requestUrl: pagePath,
      server: getServer(),
      cookie
    })

    expect(backPath).toBe(checkYourAnswersBackLink)
    expect(await rowText({ cookie, key: variationKey })).toBe('No')
  })

  it('redirects to the check your answers page when the answer is no', async () => {
    const { response } = await submitVariation('no')

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('continues to the original committed change page when the answer is yes and the original permission is unanswered', async () => {
    const { response } = await submitVariation('yes')

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(changeOriginalCommittedPath)
  })

  it('shows the answers they continued with on the check your answers page', async () => {
    let { cookie } = await submitVariation('yes')
    ;({ cookie } = await submitForm({
      requestUrl: changeOriginalCommittedPath,
      server: getServer(),
      formData: { originalCommitted: 'no' },
      cookie
    }))

    expect(await rowText({ cookie, key: variationKey })).toBe('Yes')
    expect(await rowText({ cookie, key: originalCommittedKey })).toBe('No')
  })

  it('returns to the check your answers page when the answer is yes and the original permission is already answered', async () => {
    let { cookie } = await submitVariation('yes')
    ;({ cookie } = await submitForm({
      requestUrl: changeOriginalCommittedPath,
      server: getServer(),
      formData: { originalCommitted: 'no' },
      cookie
    }))

    const { response } = await submitVariation('yes', cookie)

    expect(response.headers.location).toBe(checkYourAnswersPath)
  })

  it('discards the original permission answers when the answer changes to no, so a later yes asks again', async () => {
    let { cookie } = await submitVariation('yes')
    ;({ cookie } = await submitForm({
      requestUrl: changeOriginalCommittedPath,
      server: getServer(),
      formData: { originalCommitted: 'no' },
      cookie
    }))
    ;({ cookie } = await submitVariation('no', cookie))

    const { response } = await submitVariation('yes', cookie)

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
