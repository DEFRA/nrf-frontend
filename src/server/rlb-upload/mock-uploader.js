import crypto from 'node:crypto'
import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'

/**
 * In-memory store for mock uploads (development only)
 * Maps uploadId -> upload data
 */
const mockUploads = new Map()

/**
 * Creates a mock upload entry
 * @param {object} options - Upload options
 * @param {string} [options.callback] - Callback URL to notify when upload completes
 * @param {object} [options.metadata] - Metadata to include in callback
 * @returns {{uploadId: string, uploadUrl: string, statusUrl: string}}
 */
export function createMockUpload({ callback, metadata = {}, redirect } = {}) {
  const uploadId = crypto.randomUUID()

  mockUploads.set(uploadId, {
    uploadId,
    uploadStatus: 'pending',
    metadata: { ...metadata, redirect },
    callback,
    form: {},
    numberOfRejectedFiles: 0,
    createdAt: new Date().toISOString()
  })

  return {
    uploadId,
    uploadUrl: `/upload-and-scan/${uploadId}`,
    statusUrl: `/mock-uploader/status/${uploadId}`
  }
}

/**
 * Gets mock upload status
 * @param {string} uploadId
 * @returns {object|null}
 */
export function getMockUploadStatus(uploadId) {
  return mockUploads.get(uploadId) || null
}

/**
 * Updates mock upload with file data
 * @param {string} uploadId
 * @param {object} fileData
 */
export function updateMockUpload(uploadId, fileData) {
  const upload = mockUploads.get(uploadId)
  if (upload) {
    upload.uploadStatus = 'ready'
    upload.form = fileData
  }
}

/**
 * Calls the callback URL with file info (simulates cdp-uploader callback)
 * @param {object} upload - Upload record
 * @param {object} fileInfo - File information
 * @param {object} server - Hapi server instance for logging
 */
async function notifyCallback(upload, fileInfo, server) {
  if (!upload.callback) {
    return
  }

  const callbackPayload = {
    s3Key: fileInfo.s3Key,
    s3Bucket: fileInfo.s3Bucket,
    filename: fileInfo.filename,
    fileStatus: fileInfo.fileStatus,
    detectedContentType: fileInfo.detectedContentType,
    contentLength: fileInfo.contentLength,
    metadata: upload.metadata
  }

  try {
    server.logger.info(
      { callback: upload.callback, sessionId: upload.metadata?.sessionId },
      'Mock uploader calling callback'
    )

    await Wreck.post(upload.callback, {
      payload: JSON.stringify(callbackPayload),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    server.logger.info(
      { callback: upload.callback },
      'Mock uploader callback completed'
    )
  } catch (err) {
    server.logger.error(
      { err, callback: upload.callback },
      'Mock uploader callback failed'
    )
  }
}

/**
 * Mock CDP Uploader plugin - only registered in development
 * Provides local endpoints for testing file uploads without the real CDP Uploader
 */
export const mockUploader = {
  plugin: {
    name: 'mock-uploader',
    register(server) {
      // Safety check - never register in production
      if (config.get('isProduction')) {
        server.logger.warn(
          'Mock uploader should not be registered in production'
        )
        return
      }

      server.logger.info('Mock CDP Uploader enabled for local development')

      // POST /upload-and-scan/:uploadId - Receives file upload
      server.route({
        method: 'POST',
        path: '/upload-and-scan/{uploadId}',
        options: {
          auth: false,
          payload: {
            output: 'stream',
            parse: true,
            multipart: true,
            maxBytes: 100 * 1024 * 1024 // 100MB max
          }
        },
        async handler(request, h) {
          const { uploadId } = request.params
          const upload = mockUploads.get(uploadId)

          if (!upload) {
            return h.response({ error: 'Upload not found' }).code(404)
          }

          // Process uploaded files
          const fileData = {}
          const payload = request.payload || {}
          let firstFileInfo = null

          for (const [fieldName, field] of Object.entries(payload)) {
            if (field && field.hapi && field._data) {
              // This is a file upload
              const fileId = crypto.randomUUID()
              const fileInfo = {
                fileId,
                filename: field.hapi?.filename || 'unknown',
                contentType:
                  field.hapi?.headers?.['content-type'] ||
                  'application/octet-stream',
                fileStatus: 'complete',
                contentLength: field._data?.length || 0,
                detectedContentType:
                  field.hapi?.headers?.['content-type'] ||
                  'application/octet-stream',
                s3Key: `rlb/uploads/${uploadId}/${fileId}`,
                s3Bucket: config.get('cdpUploader.s3Bucket')
              }
              fileData[fieldName] = fileInfo

              if (!firstFileInfo) {
                firstFileInfo = fileInfo
              }
            }
          }

          updateMockUpload(uploadId, fileData)

          // Call the callback URL to notify that upload is complete
          // This simulates what real cdp-uploader does after virus scan
          if (firstFileInfo) {
            // Use setImmediate to simulate async callback (like real virus scan)
            setImmediate(() => {
              notifyCallback(upload, firstFileInfo, server)
            })
          }

          // Redirect to the status page (as real CDP Uploader would)
          const redirect = upload.metadata?.redirect || '/rlb-upload/status'
          return h.redirect(redirect)
        }
      })

      // GET /mock-uploader/status/:uploadId - Returns upload status
      server.route({
        method: 'GET',
        path: '/mock-uploader/status/{uploadId}',
        options: {
          auth: false
        },
        handler(request, h) {
          const { uploadId } = request.params
          const upload = mockUploads.get(uploadId)

          if (!upload) {
            return h.response({ error: 'Upload not found' }).code(404)
          }

          return upload
        }
      })
    }
  }
}
