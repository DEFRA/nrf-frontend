import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createMockUpload, getMockUploadStatus } from '../mock-uploader.js'

/**
 * Initiates a file upload with CDP Uploader
 * @param {object} options - Upload options
 * @param {string} options.redirect - URL to redirect to after upload
 * @param {string} [options.callback] - Callback URL for upload completion notification
 * @param {object} [options.metadata] - Custom metadata to associate with the upload
 * @returns {Promise<{uploadId: string, uploadUrl: string, statusUrl: string}>}
 */
export async function initiateUpload({ redirect, callback, metadata = {} }) {
  // Use mock uploader in development
  if (config.get('cdpUploader.useMock')) {
    return createMockUpload({ callback, metadata, redirect })
  }

  const uploaderUrl = config.get('cdpUploader.url')
  const s3Bucket = config.get('cdpUploader.s3Bucket')

  const payload = {
    redirect,
    s3Bucket,
    metadata
  }

  if (callback) {
    payload.callback = callback
  }

  const { payload: response } = await Wreck.post(`${uploaderUrl}/initiate`, {
    payload: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    },
    json: true
  })

  return response
}

/**
 * Gets the status of an upload from CDP Uploader
 * @param {string} uploadId - The upload ID to check
 * @returns {Promise<object>} Upload status including file details
 */
export async function getUploadStatus(uploadId) {
  // Use mock uploader in development
  if (config.get('cdpUploader.useMock')) {
    const status = getMockUploadStatus(uploadId)
    if (!status) {
      throw new Error(`Upload ${uploadId} not found`)
    }
    return status
  }

  const uploaderUrl = config.get('cdpUploader.url')

  const { payload } = await Wreck.get(`${uploaderUrl}/status/${uploadId}`, {
    json: true
  })

  return payload
}
