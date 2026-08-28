const CACHE_CONTROL_HEADER = 'no-store, no-cache, must-revalidate, max-age=0'

const cacheOptInPattern = /(^|[\s,])(public|private)([\s,;]|$)/

function optsIntoCaching(cacheControl) {
  return Boolean(cacheControl) && cacheOptInPattern.test(cacheControl)
}

/**
 * Prevents responses being cached by browsers or intermediate proxies, so
 * that a back/forward navigation always re-runs server-side session checks
 * instead of showing a stale render.
 *
 * no-store: never save any part of the request or response to local disk storage.
 * no-cache: forces revalidation with the origin server before serving a cached copy, even if still fresh.
 * must-revalidate: intermediate proxies must strictly respect expiration rules, never serving stale content.
 * max-age=0: explicitly sets the resource's lifespan to zero seconds.
 *
 * Routes that opt into public or private caching (e.g. cached map tiles) are
 * left as-is. Must run after catchAll so headers are set on the final view
 * response, not discarded when a Boom error is rewritten into an error page.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export function applyCacheControlHeaders(request, h) {
  const { response } = request

  if (response.isBoom) {
    response.output.headers['cache-control'] = CACHE_CONTROL_HEADER
  } else if (!optsIntoCaching(response.headers?.['cache-control'])) {
    response.header('Cache-Control', CACHE_CONTROL_HEADER)
  } else {
    // Caching opted-in explicitly; leave the header untouched.
  }

  return h.continue
}
