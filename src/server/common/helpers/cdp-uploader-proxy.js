import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'
import { createLogger } from './logging/logger.js'

const uploaderUrl = config.get('cdpUploader.url')
const logger = createLogger()

export const cdpUploaderProxy = {
  plugin: {
    name: 'cdp-uploader-proxy',
    register(server) {
      server.route({
        method: 'POST',
        path: '/upload-and-scan/{uploadId}',
        options: {
          payload: {
            maxBytes: 10 * 1024 * 1024, // 10MB
            output: 'stream',
            parse: false
          },
          plugins: {
            crumb: false
          }
        },
        handler: async (request, h) => {
          logger.info('=== UPLOAD PROXY START ===')

          try {
            const targetUrl = `${uploaderUrl}/upload-and-scan/${request.params.uploadId}`
            logger.info(`Proxying upload to: ${targetUrl}`)
            logger.info(`Content-Type: ${request.headers['content-type']}`)

            const response = await Wreck.request('POST', targetUrl, {
              payload: request.payload,
              headers: {
                'content-type': request.headers['content-type']
              },
              redirects: false
            })

            logger.info(`Response status: ${response.statusCode}`)
            logger.info(`Location header: ${response.headers.location}`)

            // Return redirect response from cdp-uploader
            if (response.statusCode === 302 || response.statusCode === 303) {
              logger.info(`Redirecting to: ${response.headers.location}`)
              return h.redirect(response.headers.location)
            }

            const payload = await Wreck.read(response)
            return h.response(payload).code(response.statusCode)
          } catch (error) {
            logger.error(`Proxy error: ${error.message}`)
            logger.error(`Error stack: ${error.stack}`)
            return h.response({ error: error.message }).code(502)
          }
        }
      })
    }
  }
}
