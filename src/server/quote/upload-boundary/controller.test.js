import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from './controller.js'
import {
  initiateUpload,
  getUploadStatus
} from '../../common/services/uploader.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'

vi.mock('../../common/services/uploader.js')
vi.mock('../helpers/form-validation-session/index.js')

describe('upload-boundary controller', () => {
  const createMockH = () => {
    const headerMock = vi.fn().mockReturnThis()
    return {
      view: vi.fn().mockReturnValue({ header: headerMock }),
      _headerMock: headerMock
    }
  }

  const createMockRequest = (session = {}) => ({
    yar: {
      get: vi.fn().mockImplementation((key) => session[key] ?? null),
      set: vi.fn(),
      clear: vi.fn()
    },
    headers: {
      host: 'localhost:3000'
    },
    info: {
      host: 'localhost:3000'
    },
    server: {
      info: {
        protocol: 'http'
      }
    }
  })

  beforeEach(() => {
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
  })

  it('should clear stale boundaryGeojson and boundaryFailureReason from session', async () => {
    const h = createMockH()
    const request = createMockRequest()
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })

    await handler(request, h)

    expect(request.yar.clear).toHaveBeenCalledWith('boundaryGeojson')
    expect(request.yar.clear).toHaveBeenCalledWith('boundaryFailureReason')
  })

  it('should render view with uploadUrl on successful initiate', async () => {
    const h = createMockH()
    const request = createMockRequest()
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })

    await handler(request, h)

    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: '/quote/upload-received'
    })
    expect(request.yar.set).toHaveBeenCalledWith(
      'pendingUploadId',
      'test-upload-id'
    )
    expect(request.yar.set).toHaveBeenCalledWith(
      'pendingUploadUrl',
      '/upload-and-scan/test-upload-id'
    )
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        uploadUrl: '/upload-and-scan/test-upload-id'
      })
    )
  })

  it('should reuse an existing pending upload session that has not received a file yet', async () => {
    const h = createMockH()
    const request = createMockRequest({
      pendingUploadId: 'existing-upload-id',
      pendingUploadUrl: '/upload-and-scan/existing-upload-id'
    })
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'initiated' })

    await handler(request, h)

    expect(getUploadStatus).toHaveBeenCalledWith('existing-upload-id')
    expect(initiateUpload).not.toHaveBeenCalled()
    expect(request.yar.set).toHaveBeenCalledWith(
      'pendingUploadId',
      'existing-upload-id'
    )
    expect(request.yar.set).toHaveBeenCalledWith(
      'pendingUploadUrl',
      '/upload-and-scan/existing-upload-id'
    )
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        uploadUrl: '/upload-and-scan/existing-upload-id'
      })
    )
  })

  it('should mint a fresh upload session when the existing one has already received a file', async () => {
    const h = createMockH()
    const request = createMockRequest({
      pendingUploadId: 'existing-upload-id',
      pendingUploadUrl: '/upload-and-scan/existing-upload-id'
    })
    vi.mocked(getUploadStatus).mockResolvedValue({ uploadStatus: 'pending' })
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'new-upload-id',
      uploadUrl: '/upload-and-scan/new-upload-id'
    })

    await handler(request, h)

    expect(getUploadStatus).toHaveBeenCalledWith('existing-upload-id')
    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: '/quote/upload-received'
    })
    expect(request.yar.set).toHaveBeenCalledWith(
      'pendingUploadId',
      'new-upload-id'
    )
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        uploadUrl: '/upload-and-scan/new-upload-id'
      })
    )
  })

  it('should render view with uploadError when initiate fails', async () => {
    const h = createMockH()
    const request = createMockRequest()
    vi.mocked(initiateUpload).mockResolvedValue({
      error: 'Unable to initiate upload'
    })

    await handler(request, h)

    expect(request.yar.set).not.toHaveBeenCalledWith(
      'pendingUploadId',
      expect.anything()
    )
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        uploadError: 'Unable to initiate upload'
      })
    )
  })

  it('should include validation errors from flash', async () => {
    const h = createMockH()
    const request = createMockRequest()
    const validationErrors = {
      summary: [{ text: 'Select a file', href: '#file' }]
    }
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors
    })
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })

    await handler(request, h)

    expect(clearValidationFlashFromCache).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        validationErrors
      })
    )
  })

  it('should push uploadStatus fail and the failureReason code from the dedicated session key', async () => {
    const h = createMockH()
    const request = createMockRequest({
      uploadRejectionReason: 'file_size_too_large'
    })
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })

    await handler(request, h)

    expect(request.yar.clear).toHaveBeenCalledWith('uploadRejectionReason')
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        uploadStatus: 'fail',
        failureReason: 'file_size_too_large'
      })
    )
  })

  it('should not push uploadStatus when there is no uploadRejectionReason in session', async () => {
    const h = createMockH()
    const request = createMockRequest()
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })

    await handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.not.objectContaining({
        uploadStatus: expect.anything()
      })
    )
  })
})
