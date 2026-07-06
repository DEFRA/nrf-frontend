import { getByRole, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { initiateUpload } from '../../common/services/uploader.js'
import { config } from '../../../config/config.js'

import { getQuoteDataFromCache } from '../helpers/quote-session-cache/index.js'

vi.mock('../helpers/quote-session-cache/index.js')
vi.mock('../../common/services/uploader.js')

const MAX = config.get('sessionRateLimit.maxRequestsPerSession')

describe('Upload boundary page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'upload'
    })
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })
  })

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Upload a red line boundary file'
    )
    expect(document.title).toBe(
      'Upload a red line boundary file - Nature restoration levy - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/quote/boundary-type'
    )
  })

  it('should render a form with action pointing to upload endpoint', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const form = document.querySelector('main form')
    expect(form).toHaveAttribute('action', '/upload-and-scan/test-upload-id')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('enctype', 'multipart/form-data')
  })

  it('should call initiateUpload with correct parameters', async () => {
    await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: '/quote/upload-received',
      s3Bucket: 'boundaries',
      s3Path: 'boundaries/',
      metadata: {}
    })
  })

  it('should show an error when upload initiation fails', async () => {
    vi.mocked(initiateUpload).mockResolvedValue({
      error: 'Unable to initiate upload'
    })

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(document.title).toBe(
      'Error: Upload a red line boundary file - Nature restoration levy - Gov.uk'
    )
    expect(
      getByRole(document, 'heading', { name: 'There is a problem' })
    ).toBeInTheDocument()
    expect(getByText(document, 'Unable to initiate upload')).toBeInTheDocument()
  })

  it('should show fallback message when no upload URL is available', async () => {
    vi.mocked(initiateUpload).mockResolvedValue({})

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(
      getByText(
        document,
        'Unable to start file upload. Please try again later.'
      )
    ).toBeInTheDocument()
    expect(document.querySelector('main form')).not.toBeInTheDocument()
  })

  it('returns 429 once the session has hit the request limit', async () => {
    const first = await getServer().inject({ method: 'GET', url: routePath })
    const cookie = []
      .concat(first.headers['set-cookie'])
      .map((c) => c.split(';')[0])
      .join('; ')

    for (let i = 1; i < MAX; i++) {
      await getServer().inject({
        method: 'GET',
        url: routePath,
        headers: { cookie }
      })
    }

    const response = await getServer().inject({
      method: 'GET',
      url: routePath,
      headers: { cookie }
    })
    expect(response.statusCode).toBe(429)
  })
})
