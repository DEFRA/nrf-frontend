import Blankie from 'blankie'
import { config } from '../../../config/config.js'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const cdpUploaderUrl = config.get('cdpUploader.url')
const gtmId = config.get('gtmId')
const gtmOrigin = 'https://*.googletagmanager.com'
const gaOrigin = 'https://*.google-analytics.com'
const gaRegion1Origin = 'https://*.google-analytics.com'

const mapExternalOrigins = [
  'https://raw.githubusercontent.com',
  'https://server.arcgisonline.com'
]

const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    defaultSrc: ['self'],
    baseUri: ['self'],
    fontSrc: ['self'],
    connectSrc: [
      'self',
      'wss',
      ...mapExternalOrigins,
      ...(gtmId ? [gtmOrigin, gaOrigin, gaRegion1Origin] : [])
    ],
    mediaSrc: ['self'],
    styleSrc: ['self', 'unsafe-inline'],
    scriptSrc: ['self', ...(gtmId ? [gtmOrigin] : [])],
    imgSrc: [
      'self',
      'data:',
      ...mapExternalOrigins,
      ...(gtmId ? [gtmOrigin, gaOrigin, gaRegion1Origin] : [])
    ],
    frameSrc: ['self', ...(gtmId ? [gtmOrigin] : [])],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self', ...(cdpUploaderUrl ? [cdpUploaderUrl] : [])],
    manifestSrc: ['self'],
    // blob: is required by maplibre-gl which creates web workers from blob URLs
    workerSrc: ['self', 'blob:'],
    childSrc: ['self', 'blob:'],
    generateNonces: 'script'
  }
}

export { contentSecurityPolicy }
