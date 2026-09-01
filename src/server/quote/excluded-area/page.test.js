import { getByRole, within } from '@testing-library/dom'
import { routePath } from './routes.js'
import { config } from '../../../config/config.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { followGetRedirect } from '../../../test-utils/follow-get-redirect.js'
import { mockCheckBoundary } from '../../../test-utils/mock-check-boundary.js'
import { checkBoundaryPath } from '../checking-file/routes.js'
import { routePath as filePreviewPath } from '../file-preview/routes.js'
import { COOKIE_ROUTE } from '../../cookies/helpers/constants.js'
import { boundaryGeojsonWithExcludedArea } from '../../../test-utils/fixtures/boundary-geojson.js'

vi.mock('../../common/services/boundary.js')

const boundaryCheckUrl = checkBoundaryPath.replace('{id}', 'test-upload-id')

describe('Excluded area page', () => {
  const getServer = setupTestServer()
  let sessionCookie

  beforeEach(async () => {
    mockCheckBoundary({ geojson: boundaryGeojsonWithExcludedArea })
    const checkCookie = await withValidQuoteSession(
      getServer(),
      boundaryCheckUrl
    )
    // GET file-preview to promote boundaryGeojson from yar into the quote
    // session cache (the handler redirects away before it would render).
    sessionCookie = await followGetRedirect({
      server: getServer(),
      url: filePreviewPath,
      cookie: checkCookie
    })
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
    let cookiePreferences

    beforeEach(async () => {
      config.set('gtmId', TEST_GTM_ID)
      const { cookie } = await submitForm({
        requestUrl: COOKIE_ROUTE,
        server: getServer(),
        formData: { analytics: 'yes', source: 'page' },
        cookie: sessionCookie
      })
      cookiePreferences = cookie
    })

    afterEach(() => {
      config.set('gtmId', null)
    })

    it('pushes rlb_intersection_areas event with the excluded area names', async () => {
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie: cookiePreferences
      })

      const { getByTestId } = within(document.documentElement)
      const script = getByTestId('gtm-upload-result')
      expect(script.textContent).toContain("event: 'rlb_intersection_areas'")
      expect(script.textContent).toContain('"River Wensum Exclusion Zone"')
    })

    it('pushes the event after the GTM init snippet', async () => {
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer(),
        cookie: cookiePreferences
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
        cookie: cookiePreferences
      })

      const { queryByTestId } = within(document.documentElement)
      expect(queryByTestId('gtm-upload-result')).toBeNull()
    })
  })
})
