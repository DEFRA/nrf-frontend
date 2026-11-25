import { getByRole } from '@testing-library/dom'
import { seedRequestToUseSessionWith } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import {
  fullQuote,
  originalNrlReference
} from '../../../../test-utils/fixtures/quote.js'

const pagePath = '/request-to-use/change/original-reference-not-matched'
const changeOriginalReferencePath =
  '/request-to-use/change/original-reference?from=reference-not-matched'

describe('Change NRL reference does not match our records page', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    seedRequestToUseSessionWith(getServer(), () => ({
      nrlReference: fullQuote.reference,
      originalNrlReference
    }))
  })

  it.each(['Back', 'Enter the NRL reference again'])(
    'sends the %s link to the change original reference page',
    async (linkName) => {
      const document = await loadPage({
        requestUrl: pagePath,
        server: getServer(),
        cookie: await withCompleteQuoteSession(getServer())
      })

      expect(getByRole(document, 'link', { name: linkName })).toHaveAttribute(
        'href',
        changeOriginalReferencePath
      )
    }
  )
})
