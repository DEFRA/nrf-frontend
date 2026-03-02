import Wreck from '@hapi/wreck'
import { config } from '../../../config/config.js'

/**
 * Proxy plugin for cdp-uploader routes in local development.
 * In production, cdp-uploader is on the same domain so no proxy is needed.
 */
export const cdpUploaderProxy = {
  plugin: {
    name: 'cdp-uploader-proxy',
    register(server) {
      // Only register proxy routes in non-production environments
      if (config.get('isProduction')) {
        return
      }

      const uploaderBaseUrl = config.get('cdpUploader.url')

      const proxyHandler = async (request, h) => {
        const targetUrl = `${uploaderBaseUrl}/upload-and-scan/${request.params.uploadId}`

        try {
          // Forward relevant headers, excluding host and content-length (will be recalculated)
          const forwardHeaders = {}
          const headersToForward = ['content-type', 'accept', 'accept-encoding']
          headersToForward.forEach((header) => {
            if (request.headers[header]) {
              forwardHeaders[header] = request.headers[header]
            }
          })

          const res = await Wreck.request(request.method, targetUrl, {
            headers: forwardHeaders,
            payload: request.payload
          })

          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400) {
            return h.redirect(res.headers.location)
          }

          // Read the response body
          const payload = await Wreck.read(res)

          const response = h.response(payload)
          response.code(res.statusCode)

          // Copy relevant headers
          const headersToCopy = ['content-type', 'content-length']
          headersToCopy.forEach((header) => {
            if (res.headers[header]) {
              response.header(header, res.headers[header])
            }
          })

          return response
        } catch (error) {
          request.logger.error(
            { error: error.message, stack: error.stack, targetUrl },
            'Error proxying to cdp-uploader'
          )
          return h.response('Upload service unavailable').code(502)
        }
      }

      // POST route needs payload settings for file uploads
      server.route({
        method: 'POST',
        path: '/upload-and-scan/{uploadId}',
        options: {
          payload: {
            output: 'stream',
            parse: false,
            maxBytes: 104857600 // 100MB
          },
          plugins: {
            crumb: false // Disable CSRF for proxy route
          }
        },
        handler: proxyHandler
      })

      // GET route (no payload settings needed)
      server.route({
        method: 'GET',
        path: '/upload-and-scan/{uploadId}',
        handler: proxyHandler
      })
    }
  }
}
