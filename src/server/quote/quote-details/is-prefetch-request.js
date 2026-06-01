/**
 * Detects link-previewers, scanners and prefetchers (tech spec §4.3).
 *
 * A real human clicking the email link sends `Sec-Fetch-User: ?1`. Bots and
 * prefetchers don't, so we treat the absence of that header as non-human and
 * avoid consuming a session or leaking quote data into a prefetch cache.
 */
export const isPrefetchRequest = (request) =>
  request.headers['sec-fetch-user'] !== '?1'
