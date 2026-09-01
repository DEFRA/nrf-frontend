import { getByRole, within } from '@testing-library/dom'
import { routePath } from './routes.js'
import { config } from '../../../config/config.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { mockCheckBoundary } from '../../../test-utils/mock-check-boundary.js'
import { checkBoundaryPath } from '../checking-file/routes.js'
import { routePath as filePreviewPath } from '../file-preview/routes.js'
import { COOKIE_ROUTE } from '../../cookies/helpers/constants.js'
import { boundaryGeojsonWithExcludedArea } from '../../../test-utils/fixtures/boundary-geojson.js'

vi.mock('../../common/services/boundary.js')

const boundaryCheckUrl = checkBoundaryPath.replace('{id}', 'test-upload-id')

// Visits the file-preview GET, which promotes boundaryGeojson from yar into
// the quote session cache (and redirects away), then returns the updated cookie.
async function cookieAfterFilePreviewVisit(server, cookie) {
  const response = await server.inject({
    method: 'GET',
    url: filePreviewPath,
    headers: { cookie }
  })
  const jar = new Map(
    (cookie ?? '')
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [name, ...rest] = c.split('=')
        return [name, rest.join('=')]
      })
  )
  for (const c of [].concat(response.headers['set-cookie'] ?? [])) {
    const [name, value] = c.split(';')[0].split('=')
    jar.set(name, value)
  }
  return [...jar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

describe('Excluded area page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
    mockCheckBoundary({ geojson: boundaryGeojsonWithExcludedArea })
    const checkCookie = await withValidQuoteSession(
      getServer(),
      boundaryCheckUrl
    )
    sessionCookie = await cookieAfterFilePreviewVisit(getServer(), checkCookie)
  })

  it('should render a page heading and a title', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer(),
      cookie: sessionCookie
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Development is within the excluded area of this Environmental Delivery Plan (EDP)'
    )
    expect(document.title).toBe(
      'Excluded area - Nature restoration levy - GOV.UK'
    )
  })

  describe('GTM intersection areas event', () => {
    const TEST_GTM_ID = 'GTM-TEST123'

    beforeEach(() => {
      config.set('gtmId', TEST_GTM_ID)
    })

    afterEach(() => {
      config.set('gtmId', null)
    })

    it('pushes rlb_intersection_areas event with the excluded area names', async () => {
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie: sessionCookie
      })

      const { getByTestId } = within(document.documentElement)
      const script = getByTestId('gtm-upload-result')
      expect(script.textContent).toContain("event: 'rlb_intersection_areas'")
      expect(script.textContent).toContain('"River Wensum Exclusion Zone"')
    })

    it('pushes the event after the GTM init snippet', async () => {
      const { cookie } = await submitForm({
        requestUrl: COOKIE_ROUTE,
        server: getServer(),
        formData: { analytics: 'yes', source: 'page' },
        cookie: sessionCookie
      })
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie
      })

      const scriptTestIds = Array.from(
        document.querySelectorAll('script[data-testid]')
      ).map((script) => script.getAttribute('data-testid'))

      expect(scriptTestIds.indexOf('gtm-upload-result')).toBeGreaterThan(
        scriptTestIds.indexOf('gtm-head')
      )
    })

    it('does not push when GTM is disabled', async () => {
      config.set('gtmId', null)
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie: sessionCookie
      })

      const { queryByTestId } = within(document.documentElement)
      expect(queryByTestId('gtm-upload-result')).toBeNull()
    })
  })
})
