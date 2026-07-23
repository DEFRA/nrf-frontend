import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { backendHeaders } from './nrf-backend.js'

const logger = createLogger()

/**
 * Prepend the CDP uploader base URL for local development.
 * In CDP cloud, the platform proxy handles routing so the path is used as-is.
 * @param {string} path - Upload path from the backend
 * @returns {string}
 */
function buildUploadUrl(path) {
  const cdpUploaderUrl = config.get('cdpUploader.url')

  if (!cdpUploaderUrl || path.startsWith('http')) {
    return path
  }

  return `${cdpUploaderUrl}${path}`
}

/**
 * Initiate an upload session via the backend. The backend owns the CDP
 * Uploader storage config (bucket, path, size limit); the frontend only
 * supplies the post-upload redirect target, which is one of its own routes.
 * @param {object} options - Upload options
 * @param {string} options.redirect - URL to redirect to after upload
 * @returns {Promise<{uploadId: string, uploadUrl: string} | {error: string}>}
 */
export async function initiateUpload({ redirect }) {
  const backendUrl = config.get('backend.apiUrl')
  const url = `${backendUrl}/upload/initiate`

  logger.info({ url, redirect }, 'Initiating upload')

  try {
    const { payload } = await Wreck.post(url, {
      payload: JSON.stringify({ redirect }),
      headers: backendHeaders({ 'Content-Type': 'application/json' }),
      json: true
    })

    return {
      uploadId: payload.uploadId,
      uploadUrl: buildUploadUrl(payload.uploadUrl)
    }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error initiating upload - url: ${url}, backendUrl: ${backendUrl}, redirect: ${redirect}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
    )
    return {
      error: 'Unable to initiate upload'
    }
  }
}

/**
 * Get the upload status from the backend
 * @param {string} uploadId - The upload ID to check status for
 * @returns {Promise<{uploadStatus: string, error?: string}>}
 */
export async function getUploadStatus(uploadId) {
  const backendUrl = config.get('backend.apiUrl')
  const url = `${backendUrl}/upload/${uploadId}/status`

  logger.info({ url, uploadId }, 'Fetching upload status')

  try {
    const { payload } = await Wreck.get(url, {
      headers: backendHeaders(),
      json: true
    })

    return {
      uploadStatus: payload.uploadStatus ?? 'unknown',
      ...(payload.error && { error: payload.error })
    }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error fetching upload status - url: ${url}, backendUrl: ${backendUrl}, uploadId: ${uploadId}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}, message: ${error?.message}`
    )
    return {
      uploadStatus: 'error',
      error: 'Unable to check upload status'
    }
  }
}
