import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'

describe('Draw boundary datasets example page', () => {
  const getServer = setupTestServer()

  it('should render map page elements without requiring a quote session', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    const hiddenHeading = getByRole(document, 'heading', { level: 1 })
    expect(hiddenHeading).toHaveTextContent(
      'Draw your boundary on a map (datasets example)'
    )
    expect(hiddenHeading).toHaveClass('govuk-visually-hidden')

    const footer = document.querySelector('.govuk-footer')
    expect(footer).not.toBeInTheDocument()

    const mapEl = document.getElementById('draw-boundary-datasets-map')
    expect(mapEl).toBeInTheDocument()
    expect(mapEl).toHaveAttribute('data-csrf-token')

    const mapCss = document.querySelector(
      'link[href*="interactive-map/interactive-map.css"]'
    )
    expect(mapCss).toBeInTheDocument()

    const datasetsCss = document.querySelector(
      'link[href*="interactive-map/plugins/datasets/index.css"]'
    )
    expect(datasetsCss).toBeInTheDocument()

    const coreScript = document.querySelector(
      'script[src*="interactive-map/core/index.js"]'
    )
    expect(coreScript).toBeInTheDocument()

    const maplibreScript = document.querySelector(
      'script[src*="interactive-map/maplibre/index.js"]'
    )
    expect(maplibreScript).toBeInTheDocument()

    const datasetsScript = document.querySelector(
      'script[src*="interactive-map/plugins/datasets/index.js"]'
    )
    expect(datasetsScript).toBeInTheDocument()

    const mapScript = document.querySelector(
      'script[src*="draw-boundary-datasets-map"]'
    )
    expect(mapScript).toBeInTheDocument()
  })
})
