/**
 * Validates and returns a safe redirect URL
 * Only allows relative paths to prevent open redirect vulnerabilities
 * @param {string} redirect - The redirect path to validate
 * @returns {string} Safe redirect path or '/' if invalid
 */
export function getSafeRedirect(redirect) {
  if (!redirect || typeof redirect !== 'string') {
    return '/'
  }

  // Only allow relative paths (must start with /)
  if (!redirect.startsWith('/')) {
    return '/'
  }

  // Prevent protocol-relative URLs (//example.com)
  if (redirect.startsWith('//')) {
    return '/'
  }

  // Prevent encoded URL schemes
  if (redirect.toLowerCase().includes('%2f%2f')) {
    return '/'
  }

  return redirect
}
