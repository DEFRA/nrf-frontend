import { getAllByRole } from '@testing-library/dom'
import { getResponse } from '../../test-utils/get-response.js'
import { loadPage } from '../../test-utils/load-page.js'
import { setupChangePlanningPageTest } from '../../test-utils/setup-change-planning-page-test.js'
import { stubUploadFlow } from '../../test-utils/stub-upload-flow.js'

const changePagesPrefix = '/request-to-use/change/'
const checkYourAnswersPath = '/request-to-use/check-your-answers'
const checkYourAnswersBackLink =
  '/request-to-use/check-your-answers?change=true'

// The pages reached from the check your answers page, whose Back link (and
// for the delete page, Cancel link) returns to it
const pagesThatLinkBackToCheckYourAnswers = [
  '/request-to-use/change/accept-levy',
  '/request-to-use/change/delete-quote-details',
  '/request-to-use/change/enter-address',
  '/request-to-use/change/original-committed',
  '/request-to-use/change/original-reference',
  '/request-to-use/change/variation'
]

// A link back to the check your answers page without the change flag is
// treated there as a direct load: with an answer missing the user is sent to
// the review and amend page instead of seeing the incomplete answers page.
describe('Change pages back links', () => {
  const { getServer, mswServer, signedInCookie } = setupChangePlanningPageTest()

  it('should carry the change flag on every link back to the check your answers page', async () => {
    // The upload page starts an upload when it is loaded
    stubUploadFlow({
      mswServer,
      uploadId: '11111111-1111-1111-1111-111111111111',
      errorCode: 'file_contains_virus',
      status: 400
    })
    const cookie = await signedInCookie()
    const changePagePaths = getServer()
      .table()
      .filter(
        ({ method, path }) =>
          method === 'get' && path.startsWith(changePagesPrefix)
      )
      .map(({ path }) => path)

    const links = []
    for (const path of changePagePaths) {
      // A page that needs other answers to render has no link to check
      const { statusCode } = await getResponse({
        server: getServer(),
        requestUrl: path,
        cookie
      })
      if (statusCode !== 200) {
        continue
      }

      const document = await loadPage({
        requestUrl: path,
        server: getServer(),
        cookie
      })
      for (const link of getAllByRole(document, 'link')) {
        const href = link.getAttribute('href')
        if (href.split('?')[0] === checkYourAnswersPath) {
          links.push({ page: path, href })
        }
      }
    }

    expect(links.map(({ page }) => page)).toEqual(
      expect.arrayContaining(pagesThatLinkBackToCheckYourAnswers)
    )
    expect(
      links.filter(({ href }) => href !== checkYourAnswersBackLink)
    ).toEqual([])
  })
})
