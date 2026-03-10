import Wreck from '@hapi/wreck'

import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'
import { getCdpUploaderUrl } from '../services/cdp-uploader.js'

async function checkCdpUploaderConnectivity(logger) {
  const baseUrl = getCdpUploaderUrl()
  const bucket = config.get('cdpUploader.bucket')

  logger.info(
    `CDP Uploader configuration - baseUrl: ${baseUrl}, bucket: ${bucket}`
  )

  const healthUrl = `${baseUrl}/health`

  try {
    const { payload } = await Wreck.get(healthUrl, {
      json: true,
      timeout: 5000
    })
    logger.info(
      `CDP Uploader is reachable - baseUrl: ${baseUrl}, response: ${JSON.stringify(payload)}`
    )
  } catch (error) {
    logger.error(
      `CDP Uploader connectivity check failed - baseUrl: ${baseUrl}, healthUrl: ${healthUrl}, statusCode: ${error?.output?.statusCode}, message: ${error?.message}`
    )
  }
}

async function startServer() {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your frontend on http://localhost:${config.get('port')}`
  )

  // Fire-and-forget connectivity check — does not block startup
  checkCdpUploaderConnectivity(server.logger)

  return server
}

export { startServer, checkCdpUploaderConnectivity }
