import { describe, it, expect, vi, beforeEach } from 'vitest'
import Wreck from '@hapi/wreck'
import { getUploadStatus, initiateUpload } from './cdp-uploader.js'

vi.mock('@hapi/wreck')

describe('cdp-uploader service', () => {
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

      expect(Wreck.post).toHaveBeenCalledWith(
        'http://localhost:7337/initiate',
        {
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
        }
      )
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
  })

  describe('getUploadStatus', () => {
    it('should return upload status on successful response', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({
        payload: { uploadStatus: 'pending' }
      })

      const result = await getUploadStatus('test-upload-id')

      expect(Wreck.get).toHaveBeenCalledWith(
        'http://localhost:7337/status/test-upload-id',
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

    it('should return unknown status when uploadStatus is missing from response', async () => {
      vi.mocked(Wreck.get).mockResolvedValue({
        payload: {}
      })

      const result = await getUploadStatus('test-upload-id')

      expect(result).toEqual({ uploadStatus: 'unknown' })
    })
  })
})
