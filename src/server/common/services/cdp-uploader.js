import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

/**
 * Get the upload status from CDP Uploader
 * @param {string} uploadId - The upload ID to check status for
 * @returns {Promise<{uploadStatus: string, error?: string}>}
 */
export async function getUploadStatus(uploadId) {
  const baseUrl = config.get('cdpUploader.url')
  const url = `${baseUrl}/status/${uploadId}`

  try {
    const { payload } = await Wreck.get(url, { json: true })

    return {
      uploadStatus: payload.uploadStatus ?? 'unknown'
    }
  } catch (error) {
    logger.error({ error, uploadId }, 'Error fetching upload status')
    return {
      uploadStatus: 'error',
      error: 'Unable to check upload status'
    }
  }
}
