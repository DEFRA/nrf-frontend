import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from './controller.js'
import { getUploadStatus } from '../../common/services/cdp-uploader.js'

vi.mock('../../common/services/cdp-uploader.js')

describe('upload-received controller', () => {
  const createMockH = () => {
    const headerMock = vi.fn().mockReturnThis()
    return {
      view: vi.fn().mockReturnValue({ header: headerMock }),
      redirect: vi.fn().mockReturnThis(),
      _headerMock: headerMock
    }
  }

  const createMockRequest = (uploadId = null) => ({
    yar: {
      get: vi.fn().mockReturnValue(uploadId)
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to upload-boundary when no uploadId in session', async () => {
    const h = createMockH()
    const request = createMockRequest(null)

    await handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-boundary')
  })

  it('should render view with ready state when status is ready', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'ready' })

    await handler(request, h)

    expect(getUploadStatus).toHaveBeenCalledWith('test-upload-id')
    expect(h.view).toHaveBeenCalledWith('quote/upload-received/index', {
      pageTitle:
        'Boundary file upload status - Nature Restoration Fund - Gov.uk',
      pageHeading: 'Boundary file upload status',
      uploadId: 'test-upload-id',
      status: 'ready',
      isProcessing: false,
      isReady: true,
      refreshInterval: null,
      errorMessage: undefined
    })
  })

  it('should render view with processing state when status is pending', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'pending' })

    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith('quote/upload-received/index', {
      pageTitle:
        'Boundary file upload status - Nature Restoration Fund - Gov.uk',
      pageHeading: 'Boundary file upload status',
      uploadId: 'test-upload-id',
      status: 'pending',
      isProcessing: true,
      isReady: false,
      refreshInterval: 5,
      errorMessage: undefined
    })
  })

  it('should render view with processing state when status is initiated', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'initiated' })

    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith('quote/upload-received/index', {
      pageTitle:
        'Boundary file upload status - Nature Restoration Fund - Gov.uk',
      pageHeading: 'Boundary file upload status',
      uploadId: 'test-upload-id',
      status: 'initiated',
      isProcessing: true,
      isReady: false,
      refreshInterval: 5,
      errorMessage: undefined
    })
  })

  it('should render view without refresh when status is error', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({
      uploadStatus: 'error',
      error: 'Upload failed'
    })

    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith('quote/upload-received/index', {
      pageTitle:
        'Boundary file upload status - Nature Restoration Fund - Gov.uk',
      pageHeading: 'Boundary file upload status',
      uploadId: 'test-upload-id',
      status: 'error',
      isProcessing: false,
      isReady: false,
      refreshInterval: null,
      errorMessage: 'Upload failed'
    })
  })
})
