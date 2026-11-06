import { routePath as startPath } from '../../manage/start-page/routes.js'

// Browsers treat "\" as "/" in special URLs, so /\example.com resolves to
// //example.com — both prefixes, and their percent-encoded forms, must be
// rejected to prevent open redirects
export const isSafeRedirect = (value) =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\') &&
  !value.toLowerCase().startsWith('/%5c') &&
  !value.toLowerCase().includes('%2f%2f')

/**
 * Validates and returns a safe redirect URL
 * Only allows relative paths to prevent open redirect vulnerabilities
 * @param {string} redirect - The redirect path to validate
 * @returns {string} Safe redirect path or the start page path if invalid
 */
export function getSafeRedirect(redirect) {
  return isSafeRedirect(redirect) ? redirect : startPath
}
