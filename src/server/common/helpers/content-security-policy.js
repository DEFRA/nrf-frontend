import Blankie from 'blankie'
import { config } from '../../../config/config.js'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const cdpUploaderUrl = config.get('cdpUploader.url')
const mapExternalOrigins = [
  'https://raw.githubusercontent.com',
  'https://server.arcgisonline.com'
]

const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    defaultSrc: ['self'],
    fontSrc: ['self'],
    connectSrc: ['self', 'wss', ...mapExternalOrigins],
    mediaSrc: ['self'],
    styleSrc: ['self'],
    scriptSrc: ['self'],
    imgSrc: ['self', 'data:'],
    frameSrc: ['self'],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self', ...(cdpUploaderUrl ? [cdpUploaderUrl] : [])],
    manifestSrc: ['self'],
    // blob: is required by maplibre-gl which creates web workers from blob URLs
    workerSrc: ['self', 'blob:'],
    childSrc: ['self', 'blob:'],
    generateNonces: true
  }
}

export { contentSecurityPolicy }
