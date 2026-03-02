import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'

const uploaderUrl = config.get('cdpUploader.url')

/**
 * Initiates a file upload session with the CDP uploader service
 * @param {string} redirectUrl - Full URL to redirect to after upload
 * @returns {Promise<{uploadUrl: string, uploadId: string}>} The upload URL and ID
 */
export async function initiateUpload(redirectUrl) {
  const { payload } = await Wreck.post(`${uploaderUrl}/initiate`, {
    json: true,
    payload: {
      redirect: redirectUrl,
      s3Bucket: 'cdp-uploader-quarantine'
    }
  })

  // Extract relative path from the absolute uploadUrl
  const url = new URL(payload.uploadUrl)
  return {
    ...payload,
    uploadUrl: url.pathname
  }
}

/**
 * Gets the status of an upload
 * @param {string} uploadId - The upload ID
 * @returns {Promise<{status: string, filename?: string, error?: string}>} The upload status
 */
export async function getUploadStatus(uploadId) {
  const { payload } = await Wreck.get(`${uploaderUrl}/status/${uploadId}`, {
    json: true
  })

  return payload
}
