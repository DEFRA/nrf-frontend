import { getByRole } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const ROUTE_PATH = '/request-to-use/change/delete-quote'

describe('Change delete quote page', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  const load = async () =>
    loadPage({
      requestUrl: ROUTE_PATH,
      server: getSeededServer(),
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

  it('should link back to the change accept levy page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/change/accept-levy'
    )
  })

  it('should link to the change accept levy page from Cancel', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: /Cancel/ })).toHaveAttribute(
      'href',
      '/request-to-use/change/accept-levy'
    )
  })
})
