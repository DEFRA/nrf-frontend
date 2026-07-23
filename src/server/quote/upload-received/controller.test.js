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
      code: vi.fn().mockReturnThis(),
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
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadUrl')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryFailureReason')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
    expect(h.view).not.toHaveBeenCalled()
  })

  it('should store failureReason and redirect to preview map for a geometry failure', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'ready' })
    vi.mocked(checkBoundary).mockResolvedValue({
      failureReason: 'self_intersecting_geometry',
      geojson: { type: 'FeatureCollection', features: [] }
    })

    await handler(request, h)

    expect(checkBoundary).toHaveBeenCalledWith('test-upload-id')
    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryFailureReason',
      'self_intersecting_geometry'
    )
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadUrl')
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
        'Boundary file upload status - Nature restoration levy - GOV.UK',
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
        'Boundary file upload status - Nature restoration levy - GOV.UK',
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
        'Boundary file upload status - Nature restoration levy - GOV.UK',
      pageHeading: 'Boundary file upload status',
      status: 'error',
      isProcessing: false,
      refreshInterval: null,
      errorMessage: 'Upload failed'
    })
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadUrl')
  })

  it('does not clear the pending upload while still processing', async () => {
    const h = createMockH()
    const request = createMockRequest('test-upload-id')
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'pending' })

    await handler(request, h)

    expect(request.yar.clear).not.toHaveBeenCalledWith('pendingUploadId')
    expect(request.yar.clear).not.toHaveBeenCalledWith('pendingUploadUrl')
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

  it('should store geojson, clear pending upload, and redirect on success', async () => {
    const mockGeojson = { type: 'FeatureCollection', features: [] }
    vi.mocked(checkBoundary).mockResolvedValue({ geojson: mockGeojson })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(checkBoundary).toHaveBeenCalledWith('test-upload-id')
    expect(request.yar.set).toHaveBeenCalledWith('boundaryGeojson', mockGeojson)
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadUrl')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryFailureReason')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
  })

  it('should store failureReason and geojson and redirect to map when boundary check fails with geojson', async () => {
    const mockGeojson = {
      error: 'self_intersecting_geometry',
      boundaryGeometryWgs84: { type: 'FeatureCollection', features: [] }
    }
    vi.mocked(checkBoundary).mockResolvedValue({
      failureReason: 'self_intersecting_geometry',
      geojson: mockGeojson
    })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith('boundaryGeojson', mockGeojson)
    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryFailureReason',
      'self_intersecting_geometry'
    )
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
  })

  it('should store failureReason without geojson and redirect to map when boundary check fails without geojson', async () => {
    vi.mocked(checkBoundary).mockResolvedValue({
      failureReason: 'boundary_check_failed'
    })

    const h = createMockH()
    const request = createMockRequest()

    await checkBoundaryHandler(request, h)

    expect(request.yar.set).not.toHaveBeenCalledWith(
      'boundaryGeojson',
      expect.anything()
    )
    expect(request.yar.set).toHaveBeenCalledWith(
      'boundaryFailureReason',
      'boundary_check_failed'
    )
    expect(request.yar.clear).toHaveBeenCalledWith('pendingUploadId')
    expect(h.redirect).toHaveBeenCalledWith('/quote/upload-preview-map')
  })
})
