import { JSDOM } from 'jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { routePath, checkBoundaryPath } from './routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { mergeCookies } from '../../../test-utils/merge-cookies.js'
import { withValidQuoteSession } from '../../../test-utils/with-valid-quote-session.js'
import { getUploadStatus } from '../../common/services/uploader.js'
import { checkBoundary } from '../../common/services/boundary.js'

import { getQuoteDataFromCache } from '../helpers/quote-session-cache/index.js'

vi.mock('../helpers/quote-session-cache/index.js')
vi.mock('../../common/services/uploader.js')
vi.mock('../../common/services/boundary.js')

/**
 * Starts a quote journey session and adds a pendingUploadId to it, using a
 * temporary route to set the yar session value. Returns the session cookie.
 */
async function withPendingUploadSession(server) {
  const quoteCookie = await withValidQuoteSession(server)
  const setupResponse = await server.inject({
    method: 'GET',
    url: '/__test-setup-session',
    headers: { cookie: quoteCookie }
  })
  return mergeCookies(quoteCookie, setupResponse.headers['set-cookie'])
}

/**
 * Loads the upload-received page with a pendingUploadId in the session.
 */
async function loadPageWithSession({ server }) {
  const cookie = await withPendingUploadSession(server)

  const response = await server.inject({
    method: 'GET',
    url: routePath,
    headers: { cookie }
  })

  const { window } = new JSDOM(response.result)
  return window.document
}

describe('Upload received page', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    // Wait for server to be ready, then register test helper route
    const checkAndRegister = () => {
      const server = getServer()
      if (server) {
        server.route({
          method: 'GET',
          path: '/__test-setup-session',
          handler(request, h) {
            request.yar.set('pendingUploadId', 'test-upload-id')
            return h.response('ok')
          }
        })
      }
    }
    // setupTestServer's beforeAll runs first, so server should be ready
    checkAndRegister()
  })

  beforeEach(() => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      planningType: 'full-planning-permission',
      boundaryEntryType: 'upload'
    })
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'pending'
    })
  })

  it('should render page heading and title when processing', async () => {
    const document = await loadPageWithSession({ server: getServer() })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Checking your file…'
    )
    expect(document.title).toBe(
      'Checking file - Nature restoration levy - GOV.UK'
    )
  })

  it('should show processing message when status is pending', async () => {
    const document = await loadPageWithSession({ server: getServer() })
    expect(
      getByText(document, 'This may take a few seconds.')
    ).toBeInTheDocument()
  })

  it('should include meta refresh tag when processing', async () => {
    const document = await loadPageWithSession({ server: getServer() })
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]')
    expect(metaRefresh).toHaveAttribute('content', '5')
  })

  it('should redirect to map page when boundary check fails', async () => {
    vi.mocked(checkBoundary).mockResolvedValue({
      error: 'Something went wrong with the boundary check'
    })

    const { response } = await submitForm({
      server: getServer(),
      requestUrl: checkBoundaryPath.replace('{id}', 'test-upload-id')
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/quote/file-preview')
  })

  it('should redirect to upload-boundary when upload error occurs', async () => {
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'error',
      error: 'Upload failed'
    })

    const cookie = await withPendingUploadSession(getServer())

    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie }
    })

    expect(response.statusCode).toBe(statusCodes.redirectAfterPost)
    expect(response.headers.location).toBe('/quote/upload-boundary')
  })
})
