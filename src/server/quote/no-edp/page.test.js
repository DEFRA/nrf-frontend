import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { routePath as boundaryTypePath } from '../boundary-type/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { submitForm } from '../../../test-utils/submit-form.js'

describe('No EDP page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(
    async () => (sessionCookie = await withValidQuoteSession(getServer()))
  )

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature Restoration Fund levy is not available in this area'
    )
    expect(document.title).toBe(
      'Nature Restoration Fund levy is not available in this area - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/upload-preview-map'
    )
  })

  it('should link back to draw-boundary when boundary entry type is draw', async () => {
    const { cookie } = await submitForm({
      requestUrl: boundaryTypePath,
      server: getServer(),
      formData: { boundaryEntryType: 'draw' }
    })

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/draw-boundary'
    )
  })
})
