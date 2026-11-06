import { routePath as startPath } from '../../manage/start-page/route-path.js'

// Browsers normalise URLs before routing: "\" is treated as "/" (so
// /\example.com resolves to //example.com) and control characters are stripped
// anywhere in the URL, so /<TAB>/evil.com resolves to //evil.com too — %09
// decodes to a literal TAB server-side. Reject all these forms to prevent open
// redirects
const MAX_CONTROL_CODE_POINT = 0x1f
const DELETE_CODE_POINT = 0x7f

const containsControlCharacter = (value) =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0)
    return (
      codePoint <= MAX_CONTROL_CODE_POINT || codePoint === DELETE_CODE_POINT
    )
  })

export const isSafeRedirect = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return false
  }

  const normalisedValue = value.toLowerCase()

  if (
    value.startsWith('//') ||
    value.startsWith('/\\') ||
    normalisedValue.startsWith('/%5c') ||
    normalisedValue.includes('%2f%2f') ||
    containsControlCharacter(value)
  ) {
    return false
  }

  return true
}

/**
 * Validates and returns a safe redirect URL
 * Only allows relative paths to prevent open redirect vulnerabilities
 * @param {string} redirect - The redirect path to validate
 * @returns {string} Safe redirect path or the start page path if invalid
 */
export function getSafeRedirect(redirect) {
  return isSafeRedirect(redirect) ? redirect : startPath
}
