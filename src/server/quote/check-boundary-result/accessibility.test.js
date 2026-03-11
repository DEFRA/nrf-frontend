// @vitest-environment jsdom
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

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

async function setupSession(server) {
  const setupResponse = await server.inject({
    method: 'GET',
    url: '/__test-setup-boundary-a11y-session'
  })
  return setupResponse.headers['set-cookie']?.[0]?.split(';')[0]
}

describe('Check boundary result page accessibility checks', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    const server = getServer()
    if (server) {
      server.route({
        method: 'GET',
        path: '/__test-setup-boundary-a11y-session',
        handler(request, h) {
          request.yar.set('boundaryGeojson', mockGeojson)
          return h.response('ok')
        }
      })
    }
  })

  it('should have no HTML accessibility issues after an invalid form submission', async () => {
    const cookie = await setupSession(getServer())
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
