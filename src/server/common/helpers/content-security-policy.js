import Blankie from 'blankie'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
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
      '*.b2clogin.com', // Azure AD B2C
      'login.microsoftonline.com', // Microsoft auth
      '*.cui.defra.gov.uk' // DEFRA Identity Provider
    ],
    mediaSrc: ['self'],
    styleSrc: ['self'],
    scriptSrc: [
      'self',
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
    ],
    imgSrc: ['self', 'data:'],
    frameSrc: [
      'self',
      'data:',
      '*.b2clogin.com' // Allow B2C login frames
    ],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: [
      'self',
      '*.b2clogin.com', // Allow form posts to B2C
      '*.cui.defra.gov.uk' // Allow form posts to DEFRA Identity
    ],
    manifestSrc: ['self'],
    generateNonces: false
  }
}

export { contentSecurityPolicy }
