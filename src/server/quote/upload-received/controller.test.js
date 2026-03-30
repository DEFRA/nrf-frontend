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

  it('should redirect to upload-boundary when no uploadId in session', async () => {
    const h = createMockH()
    const request = createMockRequest(null)

    await handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-boundary')
  })

  it('should call checkBoundary and redirect to map when status is ready', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    const mockGeojson = { type: 'FeatureCollection', features: [] }
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'ready' })
    vi.mocked(checkBoundary).mockResolvedValue({ geojson: mockGeojson })

    await handler(request, h)

    expect(getUploadStatus).toHaveBeenCalledWith('test-upload-id')
    expect(checkBoundary).toHaveBeenCalledWith('test-upload-id')
    expect(request.yar.set).toHaveBeenCalledWith('boundaryGeojson', mockGeojson)
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryError')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
    expect(h.view).not.toHaveBeenCalled()
  })

  it('should store error and redirect when status is ready but checkBoundary fails', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'ready' })
    vi.mocked(checkBoundary).mockResolvedValue({
      error: 'Invalid geometry',
      geojson: { type: 'FeatureCollection', features: [] }
    })

    await handler(request, h)

    expect(checkBoundary).toHaveBeenCalledWith('test-upload-id')
    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryError',
      'Invalid geometry'
    )
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
    expect(h.view).not.toHaveBeenCalled()
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
      status: 'pending',
      isProcessing: true,
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
      status: 'initiated',
      isProcessing: true,
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
      status: 'error',
      isProcessing: false,
      refreshInterval: null,
      errorMessage: 'Upload failed'
    })
  })
})

describe('checkBoundaryHandler', () => {
  const createMockH = () => ({
    view: vi.fn().mockReturnThis(),
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

  it('should store geojson, clear error, and redirect on success', async () => {
    const mockGeojson = { type: 'FeatureCollection', features: [] }
    vi.mocked(checkBoundary).mockResolvedValue({ geojson: mockGeojson })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(checkBoundary).toHaveBeenCalledWith('test-upload-id')
    expect(request.yar.set).toHaveBeenCalledWith('boundaryGeojson', mockGeojson)
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryError')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
  })

  it('should store error and geojson and redirect to map when boundary check fails with geojson', async () => {
    const mockGeojson = {
      error: 'Invalid geometry',
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] }
    }
    vi.mocked(checkBoundary).mockResolvedValue({
      error: 'Invalid geometry',
      geojson: mockGeojson
    })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith('boundaryGeojson', mockGeojson)
    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryError',
      'Invalid geometry'
    )
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
  })

  it('should store error without geojson and redirect to map when boundary check fails without geojson', async () => {
    vi.mocked(checkBoundary).mockResolvedValue({
      error: 'Unable to check boundary'
    })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(request.yar.set).not.toHaveBeenCalledWith(
      'boundaryGeojson',
      expect.anything()
    )
    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryError',
      'Unable to check boundary'
    )
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
  })
})
