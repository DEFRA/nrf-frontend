/**
 * Returns the originating client IP for rate-limiting.
 *
 * In a reverse-proxied deployment (e.g. CDP) request.info.remoteAddress is the
 * platform proxy's IP, not the end-user's. X-Forwarded-For contains the real
 * client IP as its first entry when set by a trusted upstream proxy.
 */
export const getClientIp = (request) =>
  request.headers['x-forwarded-for']?.split(',')[0].trim() ??
  request.info.remoteAddress
