import { routePath as startPath } from '../manage/start-page/routes.js'

/**
 * Validates and returns a safe redirect URL
 * Only allows relative paths to prevent open redirect vulnerabilities
 * @param {string} redirect - The redirect path to validate
 * @returns {string} Safe redirect path or the start page path if invalid
 */
export function getSafeRedirect(redirect) {
  if (!redirect || typeof redirect !== 'string') {
    return startPath
  }

  // Only allow relative paths (must start with /)
  if (!redirect.startsWith('/')) {
    return startPath
  }

  // Prevent protocol-relative URLs (//example.com)
  if (redirect.startsWith('//')) {
    return startPath
  }

  // Prevent encoded URL schemes
  if (redirect.toLowerCase().includes('%2f%2f')) {
    return startPath
  }

  return redirect
}
