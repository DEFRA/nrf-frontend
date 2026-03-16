import Blankie from 'blankie'
import { config } from '../../../config/config.js'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const cdpUploaderUrl = config.get('cdpUploader.url')
const mapStyleUrl = config.get('map.styleUrl')
const mapStyleOrigin = mapStyleUrl ? new URL(mapStyleUrl).origin : null

const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    // Hash 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' is to support a GOV.UK frontend script bundled within Nunjucks macros
    // https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy
    defaultSrc: ['self'],
    fontSrc: ['self', 'data:'],
    connectSrc: [
      'self',
      'wss',
      'data:',
      ...(mapStyleOrigin ? [mapStyleOrigin] : [])
    ],
    mediaSrc: ['self'],
    styleSrc: ['self'],
    scriptSrc: [
      'self',
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
    ],
    imgSrc: ['self', 'data:'],
    frameSrc: ['self', 'data:'],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self', ...(cdpUploaderUrl ? [cdpUploaderUrl] : [])],
    manifestSrc: ['self'],
    workerSrc: ['self', 'blob:'],
    childSrc: ['self', 'blob:'],
    generateNonces: true
  }
}

export { contentSecurityPolicy }
