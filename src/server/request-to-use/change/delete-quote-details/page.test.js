import { getByRole } from '@testing-library/dom'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'

const ROUTE_PATH = '/request-to-use/change/delete-quote-details'

describe('Change delete quote details page', () => {
  const getSeededServer = setupSeededRequestToUseServer()

  const load = async () =>
    loadPage({
      requestUrl: ROUTE_PATH,
      server: getSeededServer(),
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

  it('should link back to the check your answers page', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/check-your-answers?change=true'
    )
  })

  it('should link to the check your answers page from Cancel', async () => {
    const document = await load()

    expect(getByRole(document, 'link', { name: /Cancel/ })).toHaveAttribute(
      'href',
      '/request-to-use/check-your-answers?change=true'
    )
  })
})
