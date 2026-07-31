import { getByRole } from '@testing-library/dom'
import { routePath, savePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { boundaryGeojsonWithEdp } from '../../../test-utils/fixtures/boundary-geojson.js'

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

    const footer = document.querySelector('.govuk-footer')
    expect(footer).not.toBeInTheDocument()

    const phaseBanner = document.querySelector('.govuk-phase-banner')
    expect(phaseBanner).not.toBeInTheDocument()

    const mapEl = document.getElementById('draw-boundary-map')
    expect(mapEl).toBeInTheDocument()
    expect(mapEl).toHaveAttribute('data-map-style-url')
    expect(mapEl).toHaveAttribute(
      'data-save-and-continue-url',
      '/quote/draw-boundary/save'
    )
    expect(mapEl).toHaveAttribute('data-existing-boundary-geojson', 'null')
    expect(mapEl).toHaveAttribute('data-back-link-path', '/quote/boundary-type')

    const mapCss = document.querySelector(
      'link[href*="interactive-map/interactive-map.css"]'
    )
    expect(mapCss).toBeInTheDocument()

    const mapStylesCss = document.querySelector(
      'link[href*="interactive-map/plugins/map-styles/index.css"]'
    )
    expect(mapStylesCss).toBeInTheDocument()

    const datasetsCss = document.querySelector(
      'link[href*="interactive-map/plugins/datasets/index.css"]'
    )
    expect(datasetsCss).toBeInTheDocument()

    const scaleBarCss = document.querySelector(
      'link[href*="interactive-map/plugins/scale-bar/index.css"]'
    )
    expect(scaleBarCss).toBeInTheDocument()

    const mapScript = document.querySelector('script[src*="draw-boundary-map"]')
    expect(mapScript).toBeInTheDocument()
    expect(mapScript).toHaveAttribute(
      'src',
      expect.stringContaining('draw-boundary-map')
    )
  })

  it('populates map element dataset attributes from cached boundaryGeojson session data', async () => {
    let cookie = await withValidQuoteSession(getServer())
    ;({ cookie } = await submitForm({
      requestUrl: savePath,
      server: getServer(),
      formData: { boundaryGeojson: boundaryGeojsonWithEdp },
      cookie
    }))

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie
    })

    const mapEl = document.getElementById('draw-boundary-map')
    expect(mapEl).toBeInTheDocument()
    expect(mapEl).toHaveAttribute(
      'data-existing-boundary-geojson',
      JSON.stringify(boundaryGeojsonWithEdp.boundaryGeometryWgs84)
    )
    expect(mapEl).toHaveAttribute(
      'data-existing-boundary-metadata',
      JSON.stringify(boundaryGeojsonWithEdp.boundaryMetadata)
    )
  })

  it('should set the back link to check-your-answers when loaded with change=true', async () => {
    const cookie = await withValidQuoteSession(getServer())
    const document = await loadPage({
      requestUrl: `${routePath}?change=true`,
      server: getServer(),
      cookie
    })

    const mapEl = document.getElementById('draw-boundary-map')
    expect(mapEl).toHaveAttribute(
      'data-back-link-path',
      '/quote/check-your-answers'
    )
  })
})
