import { JSDOM } from 'jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { getUploadStatus } from '../../common/services/uploader.js'
import { getQuoteDataFromCache } from '../session-cache.js'

vi.mock('../session-cache.js')
vi.mock('../../common/services/uploader.js')

/**
 * Loads the upload-received page with a pendingUploadId in the session.
 * Uses a temporary route to set the yar session value, captures the cookie,
 * then makes the real page request with that cookie.
 */
async function loadPageWithSession({ server, uploadId = 'test-upload-id' }) {
  const setupResponse = await server.inject({
    method: 'GET',
    url: '/__test-setup-session'
  })

  const cookie = setupResponse.headers['set-cookie']?.[0]?.split(';')[0]

  const response = await server.inject({
    method: 'GET',
    url: routePath,
    headers: cookie ? { cookie } : {}
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
      boundaryEntryType: 'upload'
    })
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'pending'
    })
  })

  it('should render page heading and title when processing', async () => {
    const document = await loadPageWithSession({ server: getServer() })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Boundary file upload status'
    )
    expect(document.title).toBe(
      'Boundary file upload status - Nature Restoration Fund - Gov.uk'
    )
  })

  it('should show processing message when status is pending', async () => {
    const document = await loadPageWithSession({ server: getServer() })
    expect(
      getByText(document, 'Your file is being processed.')
    ).toBeInTheDocument()
    expect(
      getByText(document, 'This page will automatically refresh.')
    ).toBeInTheDocument()
  })

  it('should include meta refresh tag when processing', async () => {
    const document = await loadPageWithSession({ server: getServer() })
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]')
    expect(metaRefresh).toHaveAttribute('content', '5')
  })

  it('should show ready message when upload is complete', async () => {
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'ready'
    })

    const document = await loadPageWithSession({ server: getServer() })
    expect(
      getByText(document, 'Upload and virus scan completed.')
    ).toBeInTheDocument()
    expect(
      getByText(
        document,
        'Please click continue to check and view the boundary.'
      )
    ).toBeInTheDocument()
  })

  it('should render continue form when upload is ready', async () => {
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'ready'
    })

    const document = await loadPageWithSession({ server: getServer() })
    const form = document.querySelector('form')
    expect(form).toHaveAttribute('method', 'post')
    expect(form.getAttribute('action')).toMatch(/\/quote\/check-boundary\/.+/)
    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
  })
})
