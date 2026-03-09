import { describe, it, expect, vi, beforeEach } from 'vitest'
import Wreck from '@hapi/wreck'
import { getUploadStatus, initiateUpload } from './uploader.js'

const backendUrl = 'http://localhost:3001'

vi.mock('@hapi/wreck')

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

describe('uploader service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initiateUpload', () => {
    it('should return uploadId and uploadUrl on successful response', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({
        payload: {
          uploadId: 'test-upload-id',
          uploadUrl: '/upload-and-scan/test-upload-id'
        }
      })

      const result = await initiateUpload({
        redirect: 'http://localhost:3000/quote/upload-received',
        s3Bucket: 'test-bucket'
      })

      expect(Wreck.post).toHaveBeenCalledWith(`${backendUrl}/upload/initiate`, {
        payload: JSON.stringify({
          redirect: 'http://localhost:3000/quote/upload-received',
          s3Bucket: 'test-bucket',
          s3Path: undefined,
          metadata: undefined
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        json: true
      })
      expect(result).toEqual({
        uploadId: 'test-upload-id',
        uploadUrl: '/upload-and-scan/test-upload-id'
      })
    })

    it('should extract path from full URL response', async () => {
      vi.mocked(Wreck.post).mockResolvedValue({
        payload: {
          uploadId: 'test-upload-id',
          uploadUrl: 'http://localhost:7337/upload-and-scan/test-upload-id'
        }
      })

      const result = await initiateUpload({
        redirect: 'http://localhost:3000/quote/upload-received',
        s3Bucket: 'test-bucket'
      })

      expect(result).toEqual({
        uploadId: 'test-upload-id',
        uploadUrl: '/upload-and-scan/test-upload-id'
      })
    })

    it('should return error when request fails', async () => {
      vi.mocked(Wreck.post).mockRejectedValue(new Error('Network error'))

      const result = await initiateUpload({
        redirect: 'http://localhost:3000/quote/upload-received',
        s3Bucket: 'test-bucket'
      })

      expect(result).toEqual({
        error: 'Unable to initiate upload'
      })
    })

    it('should log error details for HTTP errors', async () => {
      const boomError = new Error('Service Unavailable')
      boomError.output = { statusCode: 503 }
      boomError.data = { payload: { message: 'upstream timeout' } }

      vi.mocked(Wreck.post).mockRejectedValue(boomError)

      await initiateUpload({
        redirect: 'http://localhost:3000/quote/upload-received',
        s3Bucket: 'test-bucket',
        s3Path: 'uploads/'
      })

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('statusCode: 503')
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(`url: ${backendUrl}/upload/initiate`)
      )
    })

    it('should log error details for connection errors', async () => {
      vi.mocked(Wreck.post).mockRejectedValue(new Error('ECONNREFUSED'))

      await initiateUpload({
        redirect: 'http://localhost:3000/quote/upload-received',
        s3Bucket: 'test-bucket'
      })

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('message: ECONNREFUSED')
      )
    })
  })

  describe('getUploadStatus', () => {
    it('should return upload status on successful response', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({
        payload: { uploadStatus: 'pending' }
      })

      const result = await getUploadStatus('test-upload-id')

      expect(Wreck.get).toHaveBeenCalledWith(
        `${backendUrl}/upload/test-upload-id/status`,
        { json: true }
      )
      expect(result).toEqual({ uploadStatus: 'pending' })
    })

    it('should return error status when request fails', async () => {
      vi.mocked(Wreck.get).mockRejectedValue(new Error('Network error'))

      const result = await getUploadStatus('test-upload-id')

      expect(result).toEqual({
        uploadStatus: 'error',
        error: 'Unable to check upload status'
      })
    })

    it('should log error details for HTTP errors', async () => {
      const boomError = new Error('Service Unavailable')
      boomError.output = { statusCode: 503 }
      boomError.data = { payload: { message: 'upstream timeout' } }

      vi.mocked(Wreck.get).mockRejectedValue(boomError)

      await getUploadStatus('test-upload-id')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('statusCode: 503')
      )
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('uploadId: test-upload-id')
      )
    })

    it('should log error details for connection errors', async () => {
      vi.mocked(Wreck.get).mockRejectedValue(new Error('ECONNREFUSED'))

      await getUploadStatus('test-upload-id')

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('message: ECONNREFUSED')
      )
    })

    it('should return unknown status when uploadStatus is missing from response', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({
        payload: {}
      })

      const result = await getUploadStatus('test-upload-id')

      expect(result).toEqual({ uploadStatus: 'unknown' })
    })
  })
})
