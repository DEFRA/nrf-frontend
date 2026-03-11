import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from './controller.js'
import { initiateUpload } from '../../common/services/uploader.js'
import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../session-cache.js'

vi.mock('../../common/services/uploader.js')
vi.mock('../session-cache.js')

describe('upload-boundary controller', () => {
  const createMockH = () => {
    const headerMock = vi.fn().mockReturnThis()
    return {
      view: vi.fn().mockReturnValue({ header: headerMock }),
      _headerMock: headerMock
    }
  }

  const createMockRequest = () => ({
    yar: {
      set: vi.fn()
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
    vi.clearAllMocks()
    vi.mocked(getValidationFlashFromCache).mockReturnValue(null)
  })

  it('should render view with uploadUrl on successful initiate', async () => {
    const h = createMockH()
    const request = createMockRequest()
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: 'http://localhost:4001/upload-and-scan/test-upload-id'
    })

    await handler(request, h)

    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: 'http://localhost:3000/quote/upload-received',
      s3Bucket: 'boundaries',
      metadata: {}
    })
    expect(request.yar.set).toHaveBeenCalledWith(
      'pendingUploadId',
      'test-upload-id'
    )
    expect(h.view).toHaveBeenCalledWith(
      'quote/upload-boundary/index',
      expect.objectContaining({
        uploadUrl: 'http://localhost:4001/upload-and-scan/test-upload-id'
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

    expect(request.yar.set).not.toHaveBeenCalled()
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
      uploadUrl: 'http://localhost:4001/upload-and-scan/test-upload-id'
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
})
