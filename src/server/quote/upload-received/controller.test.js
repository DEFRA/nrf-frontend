import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler, checkBoundaryHandler } from './controller.js'
import { getUploadStatus } from '../../common/services/uploader.js'
import { checkBoundary } from '../../common/services/boundary.js'

vi.mock('../../common/services/uploader.js')
vi.mock('../../common/services/boundary.js')

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
      get: vi.fn().mockReturnValue(uploadId),
      set: vi.fn(),
      clear: vi.fn()
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

describe('checkBoundaryHandler', () => {
  const createMockH = () => ({
    redirect: vi.fn().mockReturnThis()
  })

  const createMockRequest = () => ({
    params: { id: 'test-upload-id' },
    yar: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn()
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should store geojson and redirect on success', async () => {
    const mockGeojson = { type: 'FeatureCollection', features: [] }
    vi.mocked(checkBoundary).mockResolvedValue({ geojson: mockGeojson })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(checkBoundary).toHaveBeenCalledWith('test-upload-id')
    expect(request.yar.set).toHaveBeenCalledWith('boundaryGeojson', mockGeojson)
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(h.redirect).toHaveBeenCalledWith('/quote/check-boundary-result')
  })

  it('should redirect to upload-boundary on error', async () => {
    vi.mocked(checkBoundary).mockResolvedValue({
      error: 'Invalid geometry'
    })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryError',
      'Invalid geometry'
    )
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-boundary')
  })
})
