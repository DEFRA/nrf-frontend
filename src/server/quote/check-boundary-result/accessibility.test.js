// @vitest-environment jsdom
import { checkBoundary } from '../../common/services/boundary.js'
import { routePath } from './routes.js'
import { checkBoundaryPath } from '../upload-received/routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

vi.mock('../../common/services/boundary.js')

const mockGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0]
          ]
        ]
      },
      properties: {}
    }
  ]
}

describe('Check boundary result page accessibility checks', () => {
  const getServer = setupTestServer()

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    vi.mocked(checkBoundary).mockResolvedValue({ geojson: mockGeojson })

    const { cookie } = await submitForm({
      requestUrl: checkBoundaryPath.replace('{id}', 'test-upload-id'),
      server: getServer(),
      formData: {}
    })
    const { cookie: postCookie } = await submitForm({
      requestUrl: routePath,
      server: getServer(),
      formData: {},
      cookie
    })
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: postCookie
    })
    await runAxeChecks(document.documentElement)
  })
})
