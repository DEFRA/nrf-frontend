import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'

describe('Draw boundary page', () => {
  const getServer = setupTestServer()

  it('should render map page elements', async () => {
    const cookie = await withValidQuoteSession(getServer())
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    const hiddenHeading = getByRole(document, 'heading', { level: 1 })
    expect(hiddenHeading).toHaveTextContent('Draw your boundary on a map')
    expect(hiddenHeading).toHaveClass('govuk-visually-hidden')
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/boundary-type'
    )

    const footer = document.querySelector('.govuk-footer')
    expect(footer).not.toBeInTheDocument()

    const mapEl = document.getElementById('draw-boundary-map')
    expect(mapEl).toBeInTheDocument()
    expect(mapEl).toHaveAttribute('data-map-style-url')

    const mapCss = document.querySelector(
      'link[href*="interactive-map/interactive-map.css"]'
    )
    expect(mapCss).toBeInTheDocument()

    const mapStylesCss = document.querySelector(
      'link[href*="interactive-map/plugins/map-styles/index.css"]'
    )
    expect(mapStylesCss).toBeInTheDocument()

    const coreScript = document.querySelector(
      'script[src*="interactive-map/core/index.js"]'
    )
    expect(coreScript).toBeInTheDocument()

    const maplibreScript = document.querySelector(
      'script[src*="interactive-map/maplibre/index.js"]'
    )
    expect(maplibreScript).toBeInTheDocument()

    const mapStylesScript = document.querySelector(
      'script[src*="interactive-map/plugins/map-styles/index.js"]'
    )
    expect(mapStylesScript).toBeInTheDocument()

    const mapScript = document.querySelector('script[src*="draw-boundary-map"]')
    expect(mapScript).toBeInTheDocument()
    expect(mapScript).toHaveAttribute(
      'src',
      expect.stringContaining('draw-boundary-map')
    )
    expect(
      getByRole(document, 'link', {
        name: 'Upload a red line boundary file instead'
      })
    ).toHaveAttribute('href', '/quote/upload-boundary')
  })
})
