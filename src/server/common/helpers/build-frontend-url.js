import { config } from '../../../config/config.js'

/**
 * Builds an absolute browser-facing URL for this frontend by resolving a path
 * against the configured frontendBaseUrl origin.
 * @param {string} path - Absolute path (e.g. '/login/return')
 * @returns {string} Absolute URL
 */
export const buildFrontendUrl = (path) =>
  new URL(path, config.get('frontendBaseUrl')).toString()
