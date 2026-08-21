const cacheKey = 'request-to-use'

export function saveToSessionCache(request, payload) {
  const existing = request.yar.get(cacheKey)
  const update = { ...existing, ...payload }
  request.yar.set(cacheKey, update)
  return request.yar.get(cacheKey)
}

export function getFromSessionCache(request) {
  return request.yar.get(cacheKey)
}
