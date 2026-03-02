import { describe, it, expect, vi, beforeEach } from 'vitest'
import Wreck from '@hapi/wreck'
import { getUploadStatus } from './cdp-uploader.js'

vi.mock('@hapi/wreck')

describe('cdp-uploader service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
