import { routePath as startPath } from '../../manage/start-page/route-path.js'

// Browsers normalise URLs before routing: "\" is treated as "/" (so
// /\example.com resolves to //example.com) and control characters are stripped
// anywhere in the URL, so /<TAB>/evil.com resolves to //evil.com too — %09
// decodes to a literal TAB server-side. Reject all these forms to prevent open
// redirects
const containsControlCharacter = (value) =>
  [...value].some((character) => {
    const charCode = character.charCodeAt(0)
    return charCode < 0x20 || charCode === 0x7f
  })

export const isSafeRedirect = (value) =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\') &&
  !value.toLowerCase().startsWith('/%5c') &&
  !value.toLowerCase().includes('%2f%2f') &&
  !containsControlCharacter(value)

/**
 * Validates and returns a safe redirect URL
 * Only allows relative paths to prevent open redirect vulnerabilities
 * @param {string} redirect - The redirect path to validate
 * @returns {string} Safe redirect path or the start page path if invalid
 */
export function getSafeRedirect(redirect) {
  return isSafeRedirect(redirect) ? redirect : startPath
}
